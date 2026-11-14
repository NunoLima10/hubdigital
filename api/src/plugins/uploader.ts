import { config } from "@/config";
import { authenticate } from "@/hooks/autenticate";
import { UploadsService } from "@/modules/uploads/uploads-services";
import { errorResponseSchema, routeErrorResponses } from "@/shared/schemas";
import {
  ServiceUnavailableError,
  UnauthorizedAccessError,
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "@/utils/custom-errors";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fileUploads } from "@/db/schemas";
import { and, eq, sql } from "drizzle-orm";
import { verifyUploadImage } from "@/utils/verify-upload-image";
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
    error: () => ({ message: "Tipo de ficheiro não permitido." }),
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

      const upload = await UploadsService.createFileUpload(req.db, {
        key: fileKey,
        type,
        contentType,
        userId: req.user.id,
        byteSize,
      });
      const uploadUrl = `${config.BETTER_AUTH_URL.replace(/\/$/, "")}/v1/uploads/${upload.id}/content`;

      return reply.status(201).send({
        data: { uploadUrl, fileKey, uploadId: upload.id },
      });
    },
  });

  // Encapsulate the binary parser so JSON routes keep their normal parser and
  // body limit. Authenticate before reading or decoding an image.
  await fastify.register(async (uploads) => {
    uploads.addContentTypeParser([...allowedUploadContentTypes], { parseAs: "buffer" },
      (_req, body, done) => done(null, body));
    uploads.put<{ Params: { id: number }; Body: Buffer }>("/v1/uploads/:id/content", {
      bodyLimit: maxUploadBytes,
      onRequest: authenticate,
      config: { rateLimit: { max: 20, timeWindow: "1 minute" } },
      schema: { params: z.object({ id: z.coerce.number().int().positive() }) },
      handler: async (req) => {
        if (!s3 || !storage) throw new ServiceUnavailableError();
        return req.db.transaction(async (tx) => {
          // Serializes concurrent writes: no request may replace a completed
          // object, even if it started before the first request completed.
          await tx.execute(sql`select id from file_uploads where id=${req.params.id} and user_id=${req.user!.id} for update`);
          const upload = await tx.query.fileUploads.findFirst({
            where: and(eq(fileUploads.id, req.params.id), eq(fileUploads.userId, req.user!.id)),
          });
          if (!upload) throw new NotFoundError();
          if (upload.completedAt) throw new ConflictError("Esta imagem já foi carregada.");
          if (!Buffer.isBuffer(req.body) || req.body.length !== upload.byteSize ||
              req.headers["content-type"] !== upload.contentType) {
            throw new BadRequestError("O ficheiro não corresponde à imagem escolhida.");
          }
          const bytes = await verifyUploadImage(req.body, upload.contentType!);
          try {
            await s3.send(new PutObjectCommand({
              Bucket: storage.bucket, Key: upload.key, Body: bytes,
              ContentType: upload.contentType!, ContentLength: bytes.length,
            }));
            await tx.update(fileUploads).set({ completedAt: new Date().toISOString() })
              .where(eq(fileUploads.id, upload.id));
          } catch (error) {
            // A failed storage write or DB update must not leave a public,
            // unverified orphan. Retrying a failed cleanup is safe.
            try { await s3.send(new DeleteObjectCommand({ Bucket: storage.bucket, Key: upload.key })); }
            catch (cleanupError) { req.log.error({ err: cleanupError, key: upload.key }, "Upload cleanup failed"); }
            req.log.warn({ err: error }, "Upload storage failed");
            throw new ServiceUnavailableError();
          }
          return { data: { fileKey: upload.key } };
        });
      },
    });
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
      if (!upload.completedAt) throw new BadRequestError("A imagem ainda não terminou de carregar. Tenta novamente.");
      return reply.send({ data: { fileKey: upload.key } });
    },
  });
};

export default fastifyPlugin(uploaderPlugin, { name: "uploader" });
