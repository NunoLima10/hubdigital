import { auth } from "@/lib/auth";
import { UserRole } from "@/lib/plugins/admin";
import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance, FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";

export type User = {
  id: string;
  role: UserRole;
} | null;

declare module "fastify" {
  interface FastifyRequest {
    user: User;
  }
}

const betterAuthPlugin = async (fastify: FastifyInstance) => {
  fastify.decorateRequest("session", null);

  fastify.addHook("onRequest", async (req: FastifyRequest) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return;
    }

    req.user = {
      id: session.user.id,
      role: session.user.role as UserRole,
    };
  });

  fastify.route({
    method: ["GET", "POST"],
    url: "/v1/auth/*",
    async handler(request, reply) {
      try {
        const url = new URL(request.url, `http://${request.headers.host}`);

        const headers = new Headers();
        Object.entries(request.headers).forEach(([key, value]) => {
          if (value) headers.append(key, value.toString());
        });

        const req = new Request(url.toString(), {
          method: request.method,
          headers,
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        const response = await auth.handler(req);

        reply.status(response.status);
        response.headers.forEach((value, key) => reply.header(key, value));
        reply.send(response.body ? await response.text() : null);
      } catch (error) {
        fastify.log.error(error, "Authentication Error:");
        reply.status(500).send({
          error: "Internal authentication error",
          code: "AUTH_FAILURE",
        });
      }
    },
  });
};

export default fastifyPlugin(betterAuthPlugin, {
  name: "better-auth",
});
