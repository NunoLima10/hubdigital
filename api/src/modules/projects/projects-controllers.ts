import { SettingsService } from "@/modules/settings/settings-services";
import {
  NotFoundError,
  ServiceUnavailableError,
} from "@/utils/custom-errors";
import { WeekRange, currentWeek, previousWeek, weekFromId } from "@/utils/week";
import {
  CreateProjectReply,
  CreateProjectRequest,
  DeleteProjectReply,
  DeleteProjectRequest,
  LeaderboardReply,
  LeaderboardRequest,
  PublishProjectReply,
  PublishProjectRequest,
  GetProjectReply,
  GetProjectRequest,
  ListMyProjectsReply,
  ListMyProjectsRequest,
  ListProjectsReply,
  ListProjectsRequest,
  ToggleUpvoteReply,
  ToggleUpvoteRequest,
  UpdateProjectReply,
  UpdateProjectRequest,
} from "./projects-schemas";
import { ProjectsService } from "./projects-services";

async function createProjectHandler(
  req: CreateProjectRequest,
  reply: CreateProjectReply
) {
  const publisher = req.publisher;

  const settings = await SettingsService.getSettings(req.db);

  // The web app hides the form when submissions are closed; this is what makes
  // that a rule rather than a suggestion.
  if (!settings["submissions.open"]) {
    throw new ServiceUnavailableError();
  }

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
    req.query,
    req.user?.id
  );

  return reply.status(200).send({
    data,
    meta: { limit: req.query.limit, offset: req.query.offset, total },
  });
}

function resolvePeriod(period: ListProjectsRequest["query"]["period"]) {
  if (period === "this_week") return currentWeek();
  if (period === "last_week") return previousWeek();
  return null;
}

async function listProjectsHandler(
  req: ListProjectsRequest,
  reply: ListProjectsReply
) {
  const week = resolvePeriod(req.query.period);

  const { data, total } = await ProjectsService.listProjects(
    req.db,
    { ...req.query, week },
    req.user?.id
  );

  return reply.status(200).send({
    data,
    meta: {
      limit: req.query.limit,
      offset: req.query.offset,
      total,
      week: week?.weekId ?? null,
    },
  });
}

async function leaderboardHandler(
  req: LeaderboardRequest,
  reply: LeaderboardReply
) {
  const week: WeekRange | null = req.query.week
    ? weekFromId(req.query.week)
    : currentWeek();

  if (!week) {
    throw new NotFoundError();
  }

  const { data, total } = await ProjectsService.listProjects(
    req.db,
    { ...req.query, sort: "upvotes", week },
    req.user?.id
  );

  return reply.status(200).send({
    data,
    meta: {
      limit: req.query.limit,
      offset: req.query.offset,
      total,
      week: week.weekId,
    },
  });
}

async function publishProjectHandler(
  req: PublishProjectRequest,
  reply: PublishProjectReply
) {
  const settings = await SettingsService.getSettings(req.db);

  // A maker staff has vouched for skips the queue, so switching review on does
  // not punish the makers who earned trust before it existed.
  const trusted =
    settings["moderation.auto_approve_trusted"] &&
    Boolean(req.publisher.trustedAt);

  const requireReview = settings["moderation.review_required"] && !trusted;

  const project = await ProjectsService.publishProject(
    req.db,
    req.params.id,
    req.publisher.id,
    { requireReview }
  );

  if (!project) {
    throw new NotFoundError();
  }

  return reply.status(200).send({ data: project });
}

async function deleteProjectHandler(
  req: DeleteProjectRequest,
  reply: DeleteProjectReply
) {
  const project = await ProjectsService.deleteProject(
    req.db,
    req.params.id,
    req.publisher.id
  );

  if (!project) {
    throw new NotFoundError();
  }

  return reply.status(204).send();
}

async function getProjectHandler(
  req: GetProjectRequest,
  reply: GetProjectReply
) {
  const project = await ProjectsService.getProjectBySlug(
    req.db,
    req.params.slug,
    req.user?.id
  );

  if (!project) {
    throw new NotFoundError();
  }

  return reply.status(200).send({
    data: project,
  });
}

async function toggleUpvoteHandler(
  req: ToggleUpvoteRequest,
  reply: ToggleUpvoteReply
) {
  const result = await ProjectsService.toggleUpvote(
    req.db,
    req.params.id,
    req.user!.id,
    { ipAddress: req.ip, userAgent: req.headers["user-agent"] }
  );

  if (!result) {
    throw new NotFoundError();
  }

  return reply.status(200).send({
    data: result,
  });
}

export const projectsController = {
  createProjectHandler,
  updateProjectHandler,
  listMyProjectsHandler,
  listProjectsHandler,
  leaderboardHandler,
  getProjectHandler,
  publishProjectHandler,
  deleteProjectHandler,
  toggleUpvoteHandler,
};
