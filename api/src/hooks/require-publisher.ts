import { ProjectsService } from "@/modules/projects/projects-services";
import {
  PublisherRequiredError,
  UnauthorizedAccessError,
} from "@/utils/custom-errors";
import { FastifyRequest } from "fastify";

type Publisher = NonNullable<
  Awaited<ReturnType<typeof ProjectsService.findPublisherByUserId>>
>;

declare module "fastify" {
  interface FastifyRequest {
    publisher: Publisher;
  }
}

export async function requirePublisher(req: FastifyRequest) {
  if (!req.user) throw new UnauthorizedAccessError();

  const publisher = await ProjectsService.findPublisherByUserId(
    req.db,
    req.user.id
  );

  if (!publisher) {
    throw new PublisherRequiredError();
  }

  req.publisher = publisher;
}
