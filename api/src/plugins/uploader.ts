import { config } from "@/config";
import { fileUploads } from "@/db/schemas";
import { authenticate } from "@/hooks/autenticate";
import { UploadsService } from "@/modules/uploads/uploads-services";
import { errorResponseSchema, routeErrorResponses } from "@/shared/schemas";
import {
  BadRequestError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedAccessError,
} from "@/utils/custom-errors";
import { verifyUploadImage } from "@/utils/verify-upload-image";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  allowedUploadContentTypes,
  fileUploadTypeValues,
  maxUploadBytes,
} from "@hubdigital/shared";
import { and, eq, isNull } from "drizzle-orm";
import {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import fastifyPlugin from "fastify-plugin";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { z } from "zod";

const uploadBodySchema = z
  .object({
    name: z.string().min(1).max(255),
    byteSize: z.number().int().positive().max(maxUploadBytes),
    contentType: z.enum(allowedUploadContentTypes, {
      error: () => ({ message: "Tipo de ficheiro não permitido." }),
    }),
    type: z.enum(fileUploadTypeValues),
  })
  .superRefine((value, context) => {
    if (
      value.type === "project_gallery" &&
      !["image/png", "image/jpeg", "image/webp"].includes(value.contentType)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contentType"],
        message: "A galeria aceita apenas imagens PNG, JPG ou WebP.",
      });
    }
  });

const uploadRouteSchema = {
  tags: ["uploads"],
  body: uploadBodySchema,
  response: {
    201: z.object({
      data: z.object({
        uploadUrl: z.string(),
        fileKey: z.string(),
        uploadId: z.number(),
      }),
    }),
    503: errorResponseSchema,
    ...routeErrorResponses,
  },
};

type UploadRequest = FastifyRequest<{
  Body: z.infer<typeof uploadBodySchema>;
}>;

/**
 * `<type>/<uuid>-<safe name>` — the UUID prevents collisions and basename()
 * strips any directory the browser may have sent along.
 */
function resolveFileKey(type: string, name: string) {
  const safeName = path
    .basename(name)
    .replace(/\s+/g, "-")
    .replace(/[^\w.-]/g, "");

  return `${type}/${randomUUID()}-${safeName || "ficheiro"}`;
}

/** The presigned URL only writes to staging, so it cannot replace a final image. */
function resolveStagingKey(uploadId: number) {
  return `unverified/${uploadId}`;
}

async function readImage(stream: ReadableStream<Uint8Array>, size: number) {
  const reader = stream.getReader();
  const bytes = Buffer.alloc(size);
  let offset = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.byteLength > size - offset) {
        await reader.cancel();
        throw new BadRequestError("A imagem excede o tamanho declarado.");
      }
      bytes.set(value, offset);
      offset += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  if (offset !== size) throw new BadRequestError("A imagem está incompleta.");
  return bytes;
}

function isMissingObject(error: unknown) {
  const storageError = error as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };

  return (
    storageError.name === "NotFound" ||
    storageError.name === "NoSuchKey" ||
    storageError.$metadata?.httpStatusCode === 404
  );
}

function readStorageConfig() {
  const {
    CLOUDFLARE_BUCKET,
    CLOUDFLARE_ENDPOINT,
    CLOUDFLARE_ACCESS_KEY_ID,
    CLOUDFLARE_ACCESS_KEY_SECRET,
  } = config;

  if (
    !CLOUDFLARE_BUCKET ||
    !CLOUDFLARE_ENDPOINT ||
    !CLOUDFLARE_ACCESS_KEY_ID ||
    !CLOUDFLARE_ACCESS_KEY_SECRET
  ) {
    return null;
  }

  return {
    bucket: CLOUDFLARE_BUCKET,
    endpoint: CLOUDFLARE_ENDPOINT,
    accessKeyId: CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: CLOUDFLARE_ACCESS_KEY_SECRET,
  };
}

const uploaderPlugin = async (fastify: FastifyInstance) => {
  const storage = readStorageConfig();

  if (!storage) {
    fastify.log.warn(
      "Cloudflare R2 is not configured; POST /v1/uploads will answer 503."
    );
  }

  const s3 = storage
    ? new S3Client({
        region: config.CLOUDFLARE_REGION,
        endpoint: storage.endpoint,
        // The browser supplies the PUT body after signing.
        requestChecksumCalculation: "WHEN_REQUIRED",
        credentials: {
          accessKeyId: storage.accessKeyId,
          secretAccessKey: storage.secretAccessKey,
        },
      })
    : null;

  if (s3) {
    fastify.addHook("onClose", (_instance, done) => {
      s3.destroy();
      done();
    });
  }

  fastify.post("/v1/uploads", {
    schema: uploadRouteSchema,
    preHandler: authenticate,
    handler: async (req: UploadRequest, reply: FastifyReply) => {
      if (!req.user) throw new UnauthorizedAccessError();
      if (!s3 || !storage) throw new ServiceUnavailableError();

      const { name, contentType, type, byteSize } = req.body;
      const fileKey = resolveFileKey(type, name);
      const upload = await UploadsService.createFileUpload(req.db, {
        key: fileKey,
        type,
        contentType,
        userId: req.user.id,
        byteSize,
      });
      const uploadUrl = await getSignedUrl(
        // AWS SDK packages can resolve duplicate Smithy type declarations even
        // at matching SDK versions; the runtime client contract is identical.
        s3 as unknown as Parameters<typeof getSignedUrl>[0],
        new PutObjectCommand({
          Bucket: storage.bucket,
          Key: resolveStagingKey(upload.id),
          ContentLength: byteSize,
          ContentType: contentType,
        }) as unknown as Parameters<typeof getSignedUrl>[1],
        {
          expiresIn: config.UPLOADER_URL_EXPIRES_IN,
          signableHeaders: new Set(["content-length", "content-type"]),
        }
      );

      return reply.status(201).send({
        data: { uploadUrl, fileKey, uploadId: upload.id },
      });
    },
  });

  fastify.post<{ Params: { id: number } }>("/v1/uploads/:id/complete", {
    schema: {
      tags: ["uploads"],
      params: z.object({ id: z.coerce.number().int().positive() }),
      response: {
        200: z.object({ data: z.object({ fileKey: z.string() }) }),
        503: errorResponseSchema,
        ...routeErrorResponses,
      },
    },
    preHandler: authenticate,
    handler: async (req, reply) => {
      const upload = await req.db.query.fileUploads.findFirst({
        where: and(
          eq(fileUploads.id, req.params.id),
          eq(fileUploads.userId, req.user!.id)
        ),
      });
      if (!upload) throw new NotFoundError();
      if (!s3 || !storage) throw new ServiceUnavailableError();
      if (upload.completedAt) {
        return reply.send({ data: { fileKey: upload.key } });
      }

      const stagingKey = resolveStagingKey(upload.id);
      let verifiedBytes: Buffer;

      try {
        const metadata = await s3.send(
          new HeadObjectCommand({ Bucket: storage.bucket, Key: stagingKey })
        );
        if (
          !upload.byteSize ||
          !metadata.ETag ||
          metadata.ContentLength !== upload.byteSize ||
          metadata.ContentLength > maxUploadBytes ||
          metadata.ContentType !== upload.contentType
        ) {
          throw new BadRequestError(
            "O ficheiro carregado não corresponde à imagem escolhida."
          );
        }

        const object = await s3.send(
          new GetObjectCommand({ Bucket: storage.bucket, Key: stagingKey, IfMatch: metadata.ETag })
        );
        if (!object.Body) {
          throw new BadRequestError(
            "O ficheiro carregado não corresponde à imagem escolhida."
          );
        }
        verifiedBytes = await verifyUploadImage(
          await readImage(object.Body.transformToWebStream(), upload.byteSize),
          upload.contentType ?? ""
        );
      } catch (error) {
        if (error instanceof BadRequestError) throw error;
        if (isMissingObject(error)) {
          throw new BadRequestError(
            "A imagem ainda não terminou de carregar. Tenta novamente."
          );
        }
        req.log.warn(
          { err: error, key: stagingKey },
          "Upload verification failed"
        );
        throw new ServiceUnavailableError();
      }

      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: storage.bucket,
            Key: upload.key,
            Body: verifiedBytes,
            ContentType: upload.contentType ?? undefined,
            ContentLength: verifiedBytes.length,
          })
        );
        await req.db
          .update(fileUploads)
          .set({ completedAt: new Date().toISOString() })
          .where(
            and(eq(fileUploads.id, upload.id), isNull(fileUploads.completedAt))
          );
      } catch (error) {
        try {
          await s3.send(
            new DeleteObjectCommand({ Bucket: storage.bucket, Key: upload.key })
          );
        } catch (cleanupError) {
          req.log.error(
            { err: cleanupError, key: upload.key },
            "Final upload cleanup failed"
          );
        }
        req.log.warn(
          { err: error, key: upload.key },
          "Upload finalization failed"
        );
        throw new ServiceUnavailableError();
      }

      try {
        await s3.send(
          new DeleteObjectCommand({ Bucket: storage.bucket, Key: stagingKey })
        );
      } catch (error) {
        req.log.warn(
          { err: error, key: stagingKey },
          "Staged upload cleanup failed"
        );
      }

      return reply.send({ data: { fileKey: upload.key } });
    },
  });
};

export default fastifyPlugin(uploaderPlugin, { name: "uploader" });
