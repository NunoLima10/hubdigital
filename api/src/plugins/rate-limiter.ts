import rateLimit from "@fastify/rate-limit";
import { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";

type rateLimitPluginOptions = {
  max: number;
  timeWindow: string;
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
  });
};

export default fastifyPlugin(rateLimitPlugin);
