import { NotFoundError } from "@/utils/custom-errors";
import {
  CreateProjectReply,
  CreateProjectRequest,
  ListMyProjectsReply,
  ListMyProjectsRequest,
  ListProjectsReply,
  ListProjectsRequest,
  UpdateProjectReply,
  UpdateProjectRequest,
} from "./projects-schemas";
import { ProjectsService } from "./projects-services";

async function createProjectHandler(
  req: CreateProjectRequest,
  reply: CreateProjectReply
) {
  const publisher = req.publisher;

  const project = await ProjectsService.createProject(req.db, {
    ...req.body,
    publisherId: publisher.id,
  });

  return reply.status(201).send({
    data: project,
  });
}

async function updateProjectHandler(
  req: UpdateProjectRequest,
  reply: UpdateProjectReply
) {
  const publisher = req.publisher;

  const project = await ProjectsService.updateProject(
    req.db,
    req.params.id,
    publisher.id,
    req.body
  );

  if (!project) {
    throw new NotFoundError();
  }

  return reply.status(200).send({
    data: project,
  });
}

async function listMyProjectsHandler(
  req: ListMyProjectsRequest,
  reply: ListMyProjectsReply
) {
  const publisher = req.publisher;

  const { data, total } = await ProjectsService.listMyProjects(
    req.db,
    publisher.id,
    req.query
  );

  return reply.status(200).send({
    data,
    meta: { limit: req.query.limit, offset: req.query.offset, total },
  });
}

async function listProjectsHandler(
  req: ListProjectsRequest,
  reply: ListProjectsReply
) {
  const { data, total } = await ProjectsService.listProjects(
    req.db,
    req.query
  );

  return reply.status(200).send({
    data,
    meta: { limit: req.query.limit, offset: req.query.offset, total },
  });
}

export const projectsController = {
  createProjectHandler,
  updateProjectHandler,
  listMyProjectsHandler,
  listProjectsHandler,
};
