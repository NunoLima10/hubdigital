import { FastifyReply, FastifyRequest } from "fastify";
import { CategoriesService } from "./categories-services";

async function listCategoriesHandler(req: FastifyRequest, reply: FastifyReply) {
  const categories = await CategoriesService.listCategories(req.db);

  return reply.status(200).send({
    data: categories,
  });
}

export const categoriesController = {
  listCategoriesHandler,
};
