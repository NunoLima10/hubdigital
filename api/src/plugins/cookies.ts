import { cookies } from "@/utils/cookies";
import fastifyCookie from "@fastify/cookie";
import { FastifyInstance, FastifyReply } from "fastify";
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

  fastify.decorateReply(
    "setCookieRefreshToken",
    function (this: FastifyReply, refreshToken: string) {
      this.setCookie(
        cookies.refreshToken.key,
        refreshToken,
        cookies.refreshToken.opts
      );
    }
  );

  fastify.decorateReply(
    "clearCookieRefreshToken",
    function (this: FastifyReply) {
      this.clearCookie(cookies.refreshToken.key, cookies.refreshToken.opts);
    }
  );
};

export default fastifyPlugin(cookiesPlugin);
