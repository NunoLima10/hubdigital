import { NotFoundError } from "@/utils/custom-errors";
import {
  GetMyProjectStatsReply,
  GetMyProjectStatsRequest,
  GetProjectStatsReply,
  GetProjectStatsRequest,
  RecordEventReply,
  RecordEventRequest,
} from "./project-stats-schemas";
import { ProjectStatsService } from "./project-stats-services";

async function recordEventHandler(
  req: RecordEventRequest,
  reply: RecordEventReply
) {
  await ProjectStatsService.recordEvent(req.db, {
    projectId: req.params.id,
    type: req.body.type,
    source: req.body.source,
    viewerUserId: req.user?.id,
    userAgent: req.headers["user-agent"],
  });

  return reply.status(204).send();
}

async function getProjectStatsHandler(
  req: GetProjectStatsRequest,
  reply: GetProjectStatsReply
) {
  const stats = await ProjectStatsService.getProjectStats(
    req.db,
    req.publisher,
    req.params.id,
    req.query.range
  );

  if (!stats) {
    throw new NotFoundError();
  }

  return reply.status(200).send({ data: stats });
}

async function getMyProjectStatsHandler(
  req: GetMyProjectStatsRequest,
  reply: GetMyProjectStatsReply
) {
  const stats = await ProjectStatsService.getMyProjectStats(
    req.db,
    req.publisher,
    req.query.range
  );

  return reply.status(200).send({ data: stats });
}

export const projectStatsController = {
  recordEventHandler,
  getProjectStatsHandler,
  getMyProjectStatsHandler,
};
