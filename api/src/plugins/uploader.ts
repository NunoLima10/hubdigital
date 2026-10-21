import { config } from "@/config";
import { authenticate } from "@/hooks/autenticate";
import { UploadsService } from "@/modules/uploads/uploads-services";
import { errorResponseSchema, routeErrorResponses } from "@/shared/schemas";
import {
  ServiceUnavailableError,
  UnauthorizedAccessError,
  BadRequestError,
  NotFoundError,
} from "@/utils/custom-errors";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fileUploads } from "@/db/schemas";
import { and, eq } from "drizzle-orm";
import { matchesImageSignature } from "@/utils/image-signature";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  allowedUploadContentTypes,
  fileUploadTypeValues,
  maxUploadBytes,
} from "@hubdigital/shared";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { z } from "zod";

const uploadBodySchema = z.object({
  name: z.string().min(1).max(255),
  byteSize: z.number().int().positive().max(maxUploadBytes),
  contentType: z.enum(allowedUploadContentTypes, {
    errorMap: () => ({ message: "Tipo de ficheiro não permitido." }),
  }),
  type: z.enum(fileUploadTypeValues),
}).superRefine((value, context) => {
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
 * `<type>/<uuid>-<safe name>` — the uuid keeps two uploads of `logo.png` apart,
 * and basename() strips any directory the browser may have sent along.
 */
function resolveFileKey(type: string, name: string) {
  const safeName = path
    .basename(name)
    .replace(/\s+/g, "-")
    .replace(/[^\w.-]/g, "");

  return `${type}/${randomUUID()}-${safeName || "ficheiro"}`;
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

  // The route is always registered so the contract stays visible in Swagger and
  // the web app gets an explanatory 503 instead of a bare 404 when a developer
  // runs without R2 credentials.
  if (!storage) {
    fastify.log.warn(
      "Cloudflare R2 is not configured; POST /v1/uploads will answer 503."
    );
  }

  const s3 = storage
    ? new S3Client({
        region: config.CLOUDFLARE_REGION,
        endpoint: storage.endpoint,
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

      if (!s3 || !storage) {
        throw new ServiceUnavailableError();
      }

      const { name, contentType, type, byteSize } = req.body;
      const fileKey = resolveFileKey(type, name);

      const uploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: storage.bucket,
          Key: fileKey,
          ContentType: contentType,
        }),
        { expiresIn: config.UPLOADER_URL_EXPIRES_IN }
      );

      const upload = await UploadsService.createFileUpload(req.db, {
        key: fileKey,
        type,
        contentType,
        userId: req.user.id,
        byteSize,
      });

      return reply.status(201).send({
        data: { uploadUrl, fileKey, uploadId: upload.id },
      });
    },
  });

  fastify.post<{ Params: { id: number } }>("/v1/uploads/:id/complete", {
    schema: {
      tags: ["uploads"], params: z.object({ id: z.coerce.number().int().positive() }),
      response: { 200: z.object({ data: z.object({ fileKey: z.string() }) }), 503: errorResponseSchema, ...routeErrorResponses },
    },
    preHandler: authenticate,
    handler: async (req, reply) => {
      const upload = await req.db.query.fileUploads.findFirst({
        where: and(eq(fileUploads.id, req.params.id), eq(fileUploads.userId, req.user!.id)),
      });
      if (!upload) throw new NotFoundError();
      if (!s3 || !storage) throw new ServiceUnavailableError();
      try {
        const metadata = await s3.send(new HeadObjectCommand({ Bucket: storage.bucket, Key: upload.key }));
        if (!upload.byteSize || metadata.ContentLength !== upload.byteSize || metadata.ContentLength > maxUploadBytes || metadata.ContentType !== upload.contentType) {
          throw new BadRequestError("O ficheiro carregado não corresponde à imagem escolhida.");
        }
        const object = await s3.send(new GetObjectCommand({ Bucket: storage.bucket, Key: upload.key, Range: "bytes=0-15" }));
        const bytes = await object.Body?.transformToByteArray();
        if (!bytes || !matchesImageSignature(bytes, upload.contentType!)) throw new BadRequestError("O ficheiro não é uma imagem PNG, JPG ou WebP válida.");
      } catch (error) {
        if (error instanceof BadRequestError) throw error;
        req.log.warn({ err: error }, "Upload verification failed");
        const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
        if (status === 404) throw new BadRequestError("A imagem ainda não terminou de carregar. Tenta novamente.");
        throw new ServiceUnavailableError();
      }
      await req.db.update(fileUploads).set({ completedAt: new Date().toISOString() }).where(eq(fileUploads.id, upload.id));
      return reply.send({ data: { fileKey: upload.key } });
    },
  });
};

export default fastifyPlugin(uploaderPlugin, { name: "uploader" });
