import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

type SwaggerPluginOptions = {
  port: number;
  host: string;
  title: string;
  description: string;
  version: string;
  path: string;
};

const swaggerPlugin = async (
  fastify: FastifyInstance,
  options: SwaggerPluginOptions,
) => {
  if (!options.port) throw Error('Port is not defined');
  if (!options.host) throw Error('Host is not defined');
  if (!options.title) throw Error('Title is not defined');
  if (!options.description) throw Error('Description is not defined');
  if (!options.version) throw Error('Version is not defined');
  if (!options.path) throw Error('Path is not defined');

  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: options.title,
        description: options.description,
        version: options.version,
      },
      servers: [
        {
          url: `http://${options.host}:${options.port}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            name: 'session',
            in: 'cookie',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  });

  await fastify.register(fastifySwaggerUI, {
    routePrefix: options.path,
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
};

export default fastifyPlugin(swaggerPlugin);
