import fastifyCors from '@fastify/cors';
import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

type CorsPluginOptions = {
  methods: string[];
  origin: string[];
  allowedHeaders: string[];
  credentials?: boolean;
};

const corsPlugin = async (fastify: FastifyInstance, options: CorsPluginOptions) => {
  if (!options.origin) throw Error('Origins are not defined');
  if (!options.allowedHeaders) throw Error('Headers are not defined');

  await fastify.register(fastifyCors, {
    methods: options.methods,
    origin: options.origin,
    allowedHeaders: options.allowedHeaders,
    credentials: options.credentials,
  });
};

export default fastifyPlugin(corsPlugin);
