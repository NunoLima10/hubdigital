import fastifyCookie from "@fastify/cookie";
import { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";

type cookiesPluginOptions = {
  secret: string;
};

declare module "fastify" {
  interface FastifyReply {
    setCookieRefreshToken: (refreshToken: string) => void;
    clearCookieRefreshToken: () => void;
  }
}

const cookiesPlugin = async (
  fastify: FastifyInstance,
  options: cookiesPluginOptions
) => {
  if (!options.secret) {
    throw new Error("Cookie secret is required.");
  }

  await fastify.register(fastifyCookie, {
    secret: options.secret,
    parseOptions: {},
  });
};

export default fastifyPlugin(cookiesPlugin);
