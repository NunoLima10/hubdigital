import { FastifyInstance } from "fastify";
import { categoriesController } from "./categories-controllers";
import { listCategoriesRouteSchema } from "./categories-schemas";

export async function categoriesRoutes(server: FastifyInstance) {
  server.get("/", {
    schema: listCategoriesRouteSchema,
    handler: categoriesController.listCategoriesHandler,
  });
}
