import fastifyHelmet from "@fastify/helmet";
import { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";

type HelmetPluginOptions = {
  // Swagger UI serves HTML with inline scripts, so the strict API policy below
  // would blank it. Only pass false where the docs are actually mounted.
  strictContentSecurityPolicy: boolean;
};

const helmetPlugin = async (
  fastify: FastifyInstance,
  options: HelmetPluginOptions
) => {
  await fastify.register(fastifyHelmet, {
    // The API only answers JSON and redirects, so nothing it returns should
    // ever load a resource or be framed.
    contentSecurityPolicy: options.strictContentSecurityPolicy
      ? {
          useDefaults: false,
          directives: {
            defaultSrc: ["'none'"],
            frameAncestors: ["'none'"],
          },
        }
      : false,
    // The web and admin apps call the API cross-origin through CORS, which
    // CORP does not affect; same-site still blocks no-cors embedding by
    // unrelated sites.
    crossOriginResourcePolicy: { policy: "same-site" },
  });
};

export default fastifyPlugin(helmetPlugin);
