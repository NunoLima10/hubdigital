import { NotFoundError } from "@/utils/custom-errors";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { ShareImagesService } from "./share-images-services";

const shareImageRouteSchema = {
  tags: ["share-images"],
  params: z.object({ slug: z.string().min(1).max(200) }),
};

/**
 * The Open Graph card for a published project: what WhatsApp, Facebook,
 * LinkedIn and X show when someone shares its page.
 */
export async function shareImagesRoutes(server: FastifyInstance) {
  server.get("/projects/:slug", {
    schema: shareImageRouteSchema,
    config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    handler: async (req: FastifyRequest, reply: FastifyReply) => {
      const { slug } = req.params as { slug: string };
      const png = await ShareImagesService.getProjectShareImage(req.db, slug);
      if (!png) throw new NotFoundError();

      return reply
        .header("Content-Type", "image/png")
        .header("Cache-Control", "public, max-age=3600, s-maxage=86400")
        .send(png);
    },
  });
}
