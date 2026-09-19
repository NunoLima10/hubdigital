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
