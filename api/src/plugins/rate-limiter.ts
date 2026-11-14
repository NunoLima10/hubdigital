import rateLimit from "@fastify/rate-limit";
import { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { isUnattributedInternalRequest, rateLimitKey } from "@/utils/request-client";

type rateLimitPluginOptions = {
  max: number;
  /** Milliseconds, or a duration string such as "1 minute". */
  timeWindow: number | string;
};

const rateLimitPlugin = async (
  fastify: FastifyInstance,
  options: rateLimitPluginOptions
) => {
  if (!options.max) throw Error("Max is not defined");
  if (!options.timeWindow) throw Error("Time window is not defined");

  await fastify.register(rateLimit, {
    max: options.max,
    timeWindow: options.timeWindow,
    // Also the default for the tighter per-route limits. The auth hook is
    // app-level, so it has already set req.user when this runs.
    keyGenerator: rateLimitKey,
    allowList: (req) => isUnattributedInternalRequest(req),
  });
};

export default fastifyPlugin(rateLimitPlugin);
