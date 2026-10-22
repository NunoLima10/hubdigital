import { toPublicUrl } from "@/utils/public-url";
import { getYoutubeVideoId } from "@hubdigital/shared";
import { z } from "zod";
import { and, eq, desc, isNull, inArray } from "drizzle-orm";
import { categories, projectAnnouncements, projectRevisions, projects } from "@/db/schemas";
import { reviewAnnouncement, reviewRevision } from "@/modules/community/community-services";
import { AdminProjectsService } from "./projects-services";
import { withAudit } from "./audit-services";
import { NotFoundError } from "@/utils/custom-errors";
import { requireAdmin } from "@/hooks/has-role";
import { FastifyInstance } from "fastify";
import { adminController } from "./admin-controllers";
import {
  approveProjectRouteSchema,
  bulkCommentsRouteSchema,
  createCategoryRouteSchema,
  deleteAdminCommentRouteSchema,
  getAdminProjectRouteSchema,
  getAdminUserRouteSchema,
  getSettingsRouteSchema,
  hideCommentRouteSchema,
  hideUserRouteSchema,
  listAdminCommentsRouteSchema,
  listAdminProjectsRouteSchema,
  listAdminUsersRouteSchema,
  listAuditRouteSchema,
  listCategoriesRouteSchema,
  listReportsRouteSchema,
  reasonedProjectRouteSchema,
  resolveReportRouteSchema,
  restoreProjectRouteSchema,
  statsRouteSchema,
  trustPublisherRouteSchema,
  unhideCommentRouteSchema,
  unhideUserRouteSchema,
  updateCategoryRouteSchema,
  updateSettingsRouteSchema,
} from "./admin-schemas";

/**
 * Everything under `/v1/admin`. The guard is registered once for the whole
 * prefix rather than per route: one place to get wrong instead of thirty, and a
 * route added later is protected by default rather than by remembering.
 */
export async function adminRoutes(server: FastifyInstance) {
  server.addHook("onRequest", requireAdmin);
  server.get("/community-review", {
    handler: async (req) => {
      const announcements = await req.db
        .select({ announcement: projectAnnouncements, name: projects.name })
        .from(projectAnnouncements)
        .innerJoin(projects, eq(projects.id, projectAnnouncements.projectId))
        .where(and(eq(projectAnnouncements.status, "pending"), isNull(projects.deletedAt)))
        .orderBy(projectAnnouncements.createdAt);
      const revisions = await req.db.query.projectRevisions.findMany({
        where: eq(projectRevisions.status, "pending"),
        orderBy: desc(projectRevisions.createdAt),
      });
      return {
        data: {
          announcements,
          revisions: await Promise.all(
            revisions.map(async (revision) => {
              const project = await AdminProjectsService.getProject(req.db, revision.projectId);
              if (!project) return { ...revision, project: null, proposed: null };
              const body = revision.body;
              const ids = [body.categoryId, ...body.secondaryCategoryIds];
              const selected = await req.db.query.categories.findMany({
                where: inArray(categories.id, ids),
              });
              return {
                ...revision,
                project,
                proposed: {
                  ...project,
                  ...body,
                  description: body.description ?? null,
                  logoUrl: toPublicUrl(body.logoKey),
                  galleryImageUrls: body.galleryImageKeys.map((key) => toPublicUrl(key)),
                  youtubeVideoId: body.youtubeVideoUrl
                    ? getYoutubeVideoId(body.youtubeVideoUrl)
                    : null,
                  links: body.links.map((link, index) => ({
                    ...link,
                    id: link.id ?? -(index + 1),
                  })),
                  category: selected.find((category) => category.id === body.categoryId),
                  secondaryCategories: body.secondaryCategoryIds
                    .map((id) => selected.find((category) => category.id === id))
                    .filter(Boolean),
                },
              };
            }),
          ),
        },
      };
    },
  });
  for (const kind of ["announcements", "revisions"] as const) {
    server.post(`/community-review/${kind}/:id`, {
      schema: {
        params: z.object({ id: z.coerce.number().int().positive() }),
        body: z
          .object({ approve: z.boolean(), reason: z.string().trim().min(10).max(1000).optional() })
          .superRefine((value, ctx) => {
            if (!value.approve && !value.reason)
              ctx.addIssue({
                code: "custom",
                path: ["reason"],
                message: "Indica o motivo da rejeição.",
              });
          }),
      },
      handler: async (req) => {
        const input = req.body as { approve: boolean; reason?: string };
        const id = (req.params as { id: number }).id;
        const result = await withAudit(
          req.db,
          { id: req.user!.id },
          (tx) =>
            kind === "announcements"
              ? reviewAnnouncement(tx, id, req.user!.id, input.approve, input.reason)
              : reviewRevision(tx, id, req.user!.id, input.approve, input.reason),
          (result) => ({
            action: input.approve ? "project.approve" : "project.reject",
            targetType: "project",
            targetId: result.projectId,
            reason: input.reason,
            metadata: { entity: kind, entityId: id },
          }),
        );
        if (!result) throw new NotFoundError();
        return { data: result };
      },
    });
  }

  server.get("/stats", {
    schema: statsRouteSchema,
    handler: adminController.statsHandler,
  });

  /* settings */

  server.get("/settings", {
    schema: getSettingsRouteSchema,
    handler: adminController.getSettingsHandler,
  });

  server.patch("/settings", {
    schema: updateSettingsRouteSchema,
    handler: adminController.updateSettingsHandler,
  });

  /* projects */

  server.get("/projects", {
    schema: listAdminProjectsRouteSchema,
    handler: adminController.listProjectsHandler,
  });

  server.get("/projects/:id", {
    schema: getAdminProjectRouteSchema,
    handler: adminController.getProjectHandler,
  });

  server.post("/projects/:id/approve", {
    schema: approveProjectRouteSchema,
    handler: adminController.approveProjectHandler,
  });

  server.post("/projects/:id/reject", {
    schema: reasonedProjectRouteSchema,
    handler: adminController.rejectProjectHandler,
  });

  server.post("/projects/:id/unpublish", {
    schema: reasonedProjectRouteSchema,
    handler: adminController.unpublishProjectHandler,
  });

  server.post("/projects/:id/restore", {
    schema: restoreProjectRouteSchema,
    handler: adminController.restoreProjectHandler,
  });

  server.post("/projects/:id/shadow-ban", {
    schema: reasonedProjectRouteSchema,
    handler: adminController.hideProjectHandler,
  });

  server.delete("/projects/:id/shadow-ban", {
    schema: restoreProjectRouteSchema,
    handler: adminController.unhideProjectHandler,
  });

  server.post("/publishers/:id/trust", {
    schema: trustPublisherRouteSchema,
    handler: adminController.trustPublisherHandler,
  });

  server.delete("/publishers/:id/trust", {
    schema: trustPublisherRouteSchema,
    handler: adminController.untrustPublisherHandler,
  });

  /* comments */

  server.get("/comments", {
    schema: listAdminCommentsRouteSchema,
    handler: adminController.listCommentsHandler,
  });

  // Registered before "/comments/:id" so the literal path is not read as an id.
  server.post("/comments/bulk", {
    schema: bulkCommentsRouteSchema,
    handler: adminController.bulkCommentsHandler,
  });

  server.post("/comments/:id/hide", {
    schema: hideCommentRouteSchema,
    handler: adminController.hideCommentHandler,
  });

  server.delete("/comments/:id/hide", {
    schema: unhideCommentRouteSchema,
    handler: adminController.unhideCommentHandler,
  });

  server.delete("/comments/:id", {
    schema: deleteAdminCommentRouteSchema,
    handler: adminController.deleteCommentHandler,
  });

  /* users */

  server.get("/users", {
    schema: listAdminUsersRouteSchema,
    handler: adminController.listUsersHandler,
  });

  server.get("/users/:id", {
    schema: getAdminUserRouteSchema,
    handler: adminController.getUserHandler,
  });

  server.post("/users/:id/shadow-ban", {
    schema: hideUserRouteSchema,
    handler: adminController.hideUserHandler,
  });

  server.delete("/users/:id/shadow-ban", {
    schema: unhideUserRouteSchema,
    handler: adminController.unhideUserHandler,
  });

  /* reports */

  server.get("/reports", {
    schema: listReportsRouteSchema,
    handler: adminController.listReportsHandler,
  });

  server.post("/reports/:targetType/:targetId/resolve", {
    schema: resolveReportRouteSchema,
    handler: adminController.resolveReportHandler,
  });

  /* categories */

  server.get("/categories", {
    schema: listCategoriesRouteSchema,
    handler: adminController.listCategoriesHandler,
  });

  server.post("/categories", {
    schema: createCategoryRouteSchema,
    handler: adminController.createCategoryHandler,
  });

  server.patch("/categories/:id", {
    schema: updateCategoryRouteSchema,
    handler: adminController.updateCategoryHandler,
  });

  /* audit */

  server.get("/audit", {
    schema: listAuditRouteSchema,
    handler: adminController.listAuditHandler,
  });
}
