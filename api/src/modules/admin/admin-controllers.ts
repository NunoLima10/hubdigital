import { BadRequestError, NotFoundError } from "@/utils/custom-errors";
import { FastifyRequest } from "fastify";
import {
  ApproveReply,
  ApproveRequest,
  BulkCommentsReply,
  BulkCommentsRequest,
  ListAdminCommentsReply,
  ListAdminCommentsRequest,
  ListAdminProjectsReply,
  ListAdminProjectsRequest,
  ListAdminUsersReply,
  ListAdminUsersRequest,
  CreateCategoryReply,
  CreateCategoryRequest,
  ListAuditReply,
  ListAuditRequest,
  UpdateCategoryReply,
  UpdateCategoryRequest,
  ListReportsReply,
  ListReportsRequest,
  NumericIdReply,
  NumericIdRequest,
  ReasonedNumericReply,
  ReasonedNumericRequest,
  ReasonedStringReply,
  ReasonedStringRequest,
  ResolveReportReply,
  ResolveReportRequest,
  StatsReply,
  StatsRequest,
  StringIdReply,
  StringIdRequest,
  UpdateSettingsReply,
  UpdateSettingsRequest,
} from "./admin-schemas";
import { AuditService, withAudit } from "./audit-services";
import { AdminCategoriesService } from "./categories-services";
import { AdminCommentsService } from "./comments-services";
import { AdminProjectsService } from "./projects-services";
import { ReportsService } from "@/modules/reports/reports-services";
import { SettingsService } from "@/modules/settings/settings-services";
import { AdminStatsService } from "./stats-services";
import { AdminUsersService } from "./users-services";

/**
 * The audit row records who acted, and keeps an email snapshot so the entry
 * stays readable if that account is ever removed.
 */
async function actorOf(req: FastifyRequest) {
  const user = req.user!;
  const record = await AuditService.findActor(req.db, user.id);

  return { id: user.id, email: record?.email ?? null };
}

/* -------------------------------------------------------------------- stats */

async function statsHandler(req: StatsRequest, reply: StatsReply) {
  const data = await AdminStatsService.getStats(req.db);
  return reply.status(200).send({ data });
}

/* ----------------------------------------------------------------- settings */

async function getSettingsHandler(req: FastifyRequest, reply: StatsReply) {
  const [data, pendingCount, draftCount] = await Promise.all([
    SettingsService.getSettings(req.db),
    AdminProjectsService.countPending(req.db),
    AdminProjectsService.countDrafts(req.db),
  ]);

  return reply.status(200).send({ data, meta: { pendingCount, draftCount } });
}

async function updateSettingsHandler(
  req: UpdateSettingsRequest,
  reply: UpdateSettingsReply
) {
  const actor = await actorOf(req);
  const before = await SettingsService.getSettings(req.db);

  const data = await SettingsService.updateSettings(req.db, req.body, actor.id);

  // Not routed through withAudit: the settings write is a sequence of upserts
  // plus a cache invalidation, and wrapping it in a transaction would leave the
  // in-process cache cleared for a write that then rolled back.
  await AuditService.record(req.db, actor, {
    action: "setting.update",
    targetType: "setting",
    targetId: Object.keys(req.body).join(","),
    reason: null,
    metadata: { before, after: data },
  });

  return reply.status(200).send({ data });
}

async function publicSettingsHandler(req: FastifyRequest, reply: StatsReply) {
  const settings = await SettingsService.getSettings(req.db);

  return reply.status(200).send({
    data: {
      "submissions.open": settings["submissions.open"],
      "announcement.text": settings["announcement.text"],
    },
  });
}

/* ----------------------------------------------------------------- projects */

async function listProjectsHandler(
  req: ListAdminProjectsRequest,
  reply: ListAdminProjectsReply
) {
  const { data, total } = await AdminProjectsService.listProjects(
    req.db,
    req.query
  );

  return reply.status(200).send({
    data,
    meta: { limit: req.query.limit, offset: req.query.offset, total },
  });
}

async function getProjectHandler(req: NumericIdRequest, reply: NumericIdReply) {
  const project = await AdminProjectsService.getProject(req.db, req.params.id);

  if (!project) throw new NotFoundError();

  const history = await AuditService.listForTarget(
    req.db,
    "project",
    req.params.id
  );

  return reply.status(200).send({ data: { ...project, history } });
}

async function approveProjectHandler(req: ApproveRequest, reply: ApproveReply) {
  const actor = await actorOf(req);

  const result = await withAudit(
    req.db,
    actor,
    (tx) => AdminProjectsService.approveProject(tx, req.params.id, actor.id),
    (project) => ({
      action: "project.approve",
      targetType: "project",
      targetId: project.id,
      reason: req.body?.note ?? null,
    })
  );

  // Null means the project is not in `pending`, so there is nothing to approve.
  if (!result) throw new NotFoundError();

  return reply.status(200).send({ data: result });
}

async function rejectProjectHandler(
  req: ReasonedNumericRequest,
  reply: ReasonedNumericReply
) {
  const actor = await actorOf(req);

  const result = await withAudit(
    req.db,
    actor,
    (tx) =>
      AdminProjectsService.rejectProject(
        tx,
        req.params.id,
        actor.id,
        req.body.reason
      ),
    (project) => ({
      action: "project.reject",
      targetType: "project",
      targetId: project.id,
      reason: req.body.reason,
    })
  );

  if (!result) throw new NotFoundError();

  return reply.status(200).send({ data: result });
}

async function unpublishProjectHandler(
  req: ReasonedNumericRequest,
  reply: ReasonedNumericReply
) {
  const actor = await actorOf(req);

  const result = await withAudit(
    req.db,
    actor,
    (tx) => AdminProjectsService.unpublishProject(tx, req.params.id, actor.id),
    (project) => ({
      action: "project.unpublish",
      targetType: "project",
      targetId: project.id,
      reason: req.body.reason,
    })
  );

  if (!result) throw new NotFoundError();

  return reply.status(200).send({ data: result });
}

async function restoreProjectHandler(
  req: NumericIdRequest,
  reply: NumericIdReply
) {
  const actor = await actorOf(req);

  const result = await withAudit(
    req.db,
    actor,
    (tx) => AdminProjectsService.restoreProject(tx, req.params.id),
    (project) => ({
      action: "project.restore",
      targetType: "project",
      targetId: project.id,
      reason: null,
    })
  );

  if (!result) throw new NotFoundError();

  return reply.status(200).send({ data: result });
}

async function hideProjectHandler(
  req: ReasonedNumericRequest,
  reply: ReasonedNumericReply
) {
  const actor = await actorOf(req);

  const result = await withAudit(
    req.db,
    actor,
    (tx) =>
      AdminProjectsService.setProjectHidden(
        tx,
        req.params.id,
        actor.id,
        req.body.reason
      ),
    (project) => ({
      action: "project.shadow_ban",
      targetType: "project",
      targetId: project.id,
      reason: req.body.reason,
    })
  );

  if (!result) throw new NotFoundError();

  return reply.status(200).send({ data: result });
}

async function unhideProjectHandler(
  req: NumericIdRequest,
  reply: NumericIdReply
) {
  const actor = await actorOf(req);

  const result = await withAudit(
    req.db,
    actor,
    (tx) =>
      AdminProjectsService.setProjectHidden(tx, req.params.id, actor.id, null),
    (project) => ({
      action: "project.unshadow_ban",
      targetType: "project",
      targetId: project.id,
      reason: null,
    })
  );

  if (!result) throw new NotFoundError();

  return reply.status(200).send({ data: result });
}

function publisherTrustHandler(trusted: boolean) {
  return async function (req: NumericIdRequest, reply: NumericIdReply) {
    const actor = await actorOf(req);

    const result = await withAudit(
      req.db,
      actor,
      (tx) =>
        AdminProjectsService.setPublisherTrusted(tx, req.params.id, trusted),
      (publisher) => ({
        action: trusted ? "publisher.trust" : "publisher.untrust",
        targetType: "publisher",
        targetId: publisher.id,
        reason: null,
      })
    );

    if (!result) throw new NotFoundError();

    return reply.status(200).send({ data: result });
  };
}

/* ----------------------------------------------------------------- comments */

async function listCommentsHandler(
  req: ListAdminCommentsRequest,
  reply: ListAdminCommentsReply
) {
  const { data, total } = await AdminCommentsService.listComments(
    req.db,
    req.query
  );

  return reply.status(200).send({
    data,
    meta: { limit: req.query.limit, offset: req.query.offset, total },
  });
}

async function hideCommentHandler(
  req: ReasonedNumericRequest,
  reply: ReasonedNumericReply
) {
  const actor = await actorOf(req);

  const result = await withAudit(
    req.db,
    actor,
    (tx) =>
      AdminCommentsService.setCommentHidden(
        tx,
        req.params.id,
        actor.id,
        req.body.reason
      ),
    (comment) => ({
      action: "comment.hide",
      targetType: "comment",
      targetId: comment.id,
      reason: req.body.reason,
      metadata: { projectId: comment.projectId },
    })
  );

  if (!result) throw new NotFoundError();

  return reply.status(200).send({ data: { id: result.id } });
}

async function unhideCommentHandler(
  req: NumericIdRequest,
  reply: NumericIdReply
) {
  const actor = await actorOf(req);

  const result = await withAudit(
    req.db,
    actor,
    (tx) =>
      AdminCommentsService.setCommentHidden(tx, req.params.id, actor.id, null),
    (comment) => ({
      action: "comment.unhide",
      targetType: "comment",
      targetId: comment.id,
      reason: null,
    })
  );

  if (!result) throw new NotFoundError();

  return reply.status(200).send({ data: { id: result.id } });
}

async function deleteCommentHandler(
  req: ReasonedNumericRequest,
  reply: ReasonedNumericReply
) {
  const actor = await actorOf(req);

  const result = await withAudit(
    req.db,
    actor,
    (tx) =>
      AdminCommentsService.deleteComment(
        tx,
        req.params.id,
        actor.id,
        req.body.reason
      ),
    (comment) => ({
      action: "comment.delete",
      targetType: "comment",
      targetId: comment.id,
      reason: req.body.reason,
      metadata: { projectId: comment.projectId },
    })
  );

  if (!result) throw new NotFoundError();

  return reply.status(204).send();
}

async function bulkCommentsHandler(
  req: BulkCommentsRequest,
  reply: BulkCommentsReply
) {
  const actor = await actorOf(req);
  const { ids, action, reason } = req.body;

  const affected = await req.db.transaction(async (trx) => {
    const tx = trx as unknown as typeof req.db;

    const changed = await AdminCommentsService.bulkModerate(
      tx,
      ids,
      actor.id,
      action,
      reason
    );

    // One audit row per comment, not one per request: the log is queried by
    // target, and a batch entry would be invisible from a comment's history.
    for (const id of changed) {
      await AuditService.record(tx, actor, {
        action: action === "hide" ? "comment.hide" : "comment.delete",
        targetType: "comment",
        targetId: id,
        reason,
        metadata: { bulk: true },
      });
    }

    return changed;
  });

  return reply.status(200).send({ data: { affected } });
}

/* -------------------------------------------------------------------- users */

async function listUsersHandler(
  req: ListAdminUsersRequest,
  reply: ListAdminUsersReply
) {
  const { data, total } = await AdminUsersService.listUsers(req.db, req.query);

  return reply.status(200).send({
    data,
    meta: { limit: req.query.limit, offset: req.query.offset, total },
  });
}

async function getUserHandler(req: StringIdRequest, reply: StringIdReply) {
  const user = await AdminUsersService.getUser(req.db, req.params.id);

  if (!user) throw new NotFoundError();

  const history = await AuditService.listForTarget(req.db, "user", req.params.id);

  return reply.status(200).send({ data: { ...user, history } });
}

async function hideUserHandler(
  req: ReasonedStringRequest,
  reply: ReasonedStringReply
) {
  const actor = await actorOf(req);

  // Hiding yourself would leave the platform with a hidden admin and no
  // obvious way back; it is never what was meant.
  if (req.params.id === actor.id) {
    throw new BadRequestError("não é possível ocultar a sua própria conta");
  }

  const result = await withAudit(
    req.db,
    actor,
    (tx) =>
      AdminUsersService.setUserHidden(
        tx,
        req.params.id,
        actor.id,
        req.body.reason
      ),
    (user) => ({
      action: "user.shadow_ban",
      targetType: "user",
      targetId: user.id,
      reason: req.body.reason,
      metadata: { email: user.email },
    })
  );

  if (!result) throw new NotFoundError();

  return reply.status(200).send({ data: { id: result.id } });
}

async function unhideUserHandler(req: StringIdRequest, reply: StringIdReply) {
  const actor = await actorOf(req);

  const result = await withAudit(
    req.db,
    actor,
    (tx) => AdminUsersService.setUserHidden(tx, req.params.id, actor.id, null),
    (user) => ({
      action: "user.unshadow_ban",
      targetType: "user",
      targetId: user.id,
      reason: null,
    })
  );

  if (!result) throw new NotFoundError();

  return reply.status(200).send({ data: { id: result.id } });
}

/* ------------------------------------------------------------------ reports */

async function listReportsHandler(
  req: ListReportsRequest,
  reply: ListReportsReply
) {
  const data = await ReportsService.listReportGroups(req.db, req.query.status);

  return reply.status(200).send({ data });
}

async function resolveReportHandler(
  req: ResolveReportRequest,
  reply: ResolveReportReply
) {
  const actor = await actorOf(req);
  const { targetType, targetId } = req.params;

  const result = await withAudit(
    req.db,
    actor,
    (tx) =>
      ReportsService.resolveTarget(
        tx,
        targetType,
        targetId,
        actor.id,
        req.body.outcome,
        req.body.note
      ),
    (ids) => ({
      action: "report.resolve",
      targetType: "report",
      targetId: `${targetType}:${targetId}`,
      reason: req.body.note ?? null,
      metadata: { outcome: req.body.outcome, reportIds: ids },
    })
  );

  if (!result) throw new NotFoundError();

  return reply.status(200).send({ data: { resolved: result.length } });
}

/* --------------------------------------------------------------- categories */

async function listCategoriesHandler(req: FastifyRequest, reply: StatsReply) {
  const data = await AdminCategoriesService.listWithCounts(req.db);
  return reply.status(200).send({ data });
}

async function createCategoryHandler(
  req: CreateCategoryRequest,
  reply: CreateCategoryReply
) {
  const actor = await actorOf(req);

  const created = await withAudit(
    req.db,
    actor,
    (tx) => AdminCategoriesService.createCategory(tx, req.body),
    (category) => ({
      action: "category.create",
      targetType: "setting",
      targetId: String(category.id),
      reason: null,
      metadata: { key: category.key, name: category.name },
    })
  );

  return reply.status(201).send({ data: created });
}

async function updateCategoryHandler(
  req: UpdateCategoryRequest,
  reply: UpdateCategoryReply
) {
  const actor = await actorOf(req);

  const updated = await withAudit(
    req.db,
    actor,
    (tx) =>
      AdminCategoriesService.updateCategory(tx, req.params.id, req.body.name),
    (category) => ({
      action: "category.update",
      targetType: "setting",
      targetId: String(category.id),
      reason: null,
      metadata: { name: category.name },
    })
  );

  if (!updated) throw new NotFoundError();

  return reply.status(200).send({ data: updated });
}

/* -------------------------------------------------------------------- audit */

async function listAuditHandler(req: ListAuditRequest, reply: ListAuditReply) {
  const { data, total } = await AuditService.listAudit(req.db, req.query);

  return reply.status(200).send({
    data,
    meta: { limit: req.query.limit, offset: req.query.offset, total },
  });
}

export const adminController = {
  statsHandler,
  getSettingsHandler,
  updateSettingsHandler,
  publicSettingsHandler,
  listProjectsHandler,
  getProjectHandler,
  approveProjectHandler,
  rejectProjectHandler,
  unpublishProjectHandler,
  restoreProjectHandler,
  hideProjectHandler,
  unhideProjectHandler,
  trustPublisherHandler: publisherTrustHandler(true),
  untrustPublisherHandler: publisherTrustHandler(false),
  listCommentsHandler,
  hideCommentHandler,
  unhideCommentHandler,
  deleteCommentHandler,
  bulkCommentsHandler,
  listUsersHandler,
  getUserHandler,
  hideUserHandler,
  unhideUserHandler,
  listReportsHandler,
  resolveReportHandler,
  listAuditHandler,
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
};
