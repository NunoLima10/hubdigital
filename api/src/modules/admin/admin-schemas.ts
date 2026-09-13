import { errorResponseSchema, routeErrorResponses } from "@/shared/schemas";
import {
  adminCategorySchema,
  adminCommentSchema,
  adminCommentStateValues,
  adminProjectDetailSchema,
  adminProjectSchema,
  adminStatsSchema,
  adminUserDetailSchema,
  adminUserSchema,
  auditEntrySchema,
  bulkCommentBodySchema,
  createCategoryBodySchema,
  islandValues,
  moderationActionValues,
  moderationTargetValues,
  optionalNoteBodySchema,
  projectStatusValues,
  publicSettingsSchema,
  reasonBodySchema,
  reportGroupSchema,
  reportStatusValues,
  resolveReportBodySchema,
  settingsPatchSchema,
  settingsSchema,
  updateCategoryBodySchema,
  userRoleValues,
} from "@hubdigital/shared";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const TAG = ["admin"];

const paginationSchema = {
  limit: z.coerce.number().int().positive().max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
};

const listMetaSchema = z.object({
  limit: z.number(),
  offset: z.number(),
  total: z.number(),
});

export const numericIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const stringIdParams = z.object({ id: z.string().min(1) });

/** 403 is the answer a signed-in non-admin gets, so every admin route declares it. */
const adminErrorResponses = {
  403: errorResponseSchema,
  ...routeErrorResponses,
};

/* -------------------------------------------------------------------- stats */

export const statsRouteSchema = {
  tags: TAG,
  response: {
    200: z.object({ data: adminStatsSchema }),
    ...adminErrorResponses,
  },
};

export type StatsRequest = FastifyRequest;
export type StatsReply = FastifyReply;

/* ----------------------------------------------------------------- settings */

export const getSettingsRouteSchema = {
  tags: TAG,
  response: {
    200: z.object({
      data: settingsSchema,
      // What switching the review gate on would immediately affect, so the
      // toggle can warn before it is flipped.
      meta: z.object({ pendingCount: z.number(), draftCount: z.number() }),
    }),
    ...adminErrorResponses,
  },
};

export const updateSettingsRouteSchema = {
  tags: TAG,
  body: settingsPatchSchema,
  response: {
    200: z.object({ data: settingsSchema }),
    ...adminErrorResponses,
  },
};

type UpdateSettingsGeneric = { Body: z.infer<typeof settingsPatchSchema> };

export type UpdateSettingsRequest = FastifyRequest<UpdateSettingsGeneric>;
export type UpdateSettingsReply = FastifyReply<UpdateSettingsGeneric>;

export const publicSettingsRouteSchema = {
  tags: ["settings"],
  response: {
    200: z.object({ data: publicSettingsSchema }),
    ...routeErrorResponses,
  },
};

/* ----------------------------------------------------------------- projects */

const listProjectsQuery = z.object({
  ...paginationSchema,
  status: z.enum(projectStatusValues).optional(),
  q: z.string().trim().min(1).optional(),
  island: z.enum(islandValues).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  publisherId: z.coerce.number().int().positive().optional(),
  hidden: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  deleted: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sort: z.enum(["newest", "queued"]).default("newest"),
});

export const listAdminProjectsRouteSchema = {
  tags: TAG,
  querystring: listProjectsQuery,
  response: {
    200: z.object({
      data: z.array(adminProjectSchema),
      meta: listMetaSchema,
    }),
    ...adminErrorResponses,
  },
};

type ListAdminProjectsGeneric = { Querystring: z.infer<typeof listProjectsQuery> };

export type ListAdminProjectsRequest = FastifyRequest<ListAdminProjectsGeneric>;
export type ListAdminProjectsReply = FastifyReply<ListAdminProjectsGeneric>;

export const getAdminProjectRouteSchema = {
  tags: TAG,
  params: numericIdParams,
  response: {
    200: z.object({ data: adminProjectDetailSchema }),
    ...adminErrorResponses,
  },
};

type NumericIdGeneric = { Params: z.infer<typeof numericIdParams> };

export type NumericIdRequest = FastifyRequest<NumericIdGeneric>;
export type NumericIdReply = FastifyReply<NumericIdGeneric>;

const projectActionResult = z.object({
  data: z.object({
    id: z.number(),
    slug: z.string(),
    status: z.enum(projectStatusValues).optional(),
  }),
});

export const approveProjectRouteSchema = {
  tags: TAG,
  params: numericIdParams,
  body: optionalNoteBodySchema.optional(),
  response: { 200: projectActionResult, ...adminErrorResponses },
};

type ApproveGeneric = {
  Params: z.infer<typeof numericIdParams>;
  Body: z.infer<typeof optionalNoteBodySchema> | undefined;
};

export type ApproveRequest = FastifyRequest<ApproveGeneric>;
export type ApproveReply = FastifyReply<ApproveGeneric>;

export const reasonedProjectRouteSchema = {
  tags: TAG,
  params: numericIdParams,
  body: reasonBodySchema,
  response: { 200: projectActionResult, ...adminErrorResponses },
};

type ReasonedNumericGeneric = {
  Params: z.infer<typeof numericIdParams>;
  Body: z.infer<typeof reasonBodySchema>;
};

export type ReasonedNumericRequest = FastifyRequest<ReasonedNumericGeneric>;
export type ReasonedNumericReply = FastifyReply<ReasonedNumericGeneric>;

export const restoreProjectRouteSchema = {
  tags: TAG,
  params: numericIdParams,
  response: { 200: projectActionResult, ...adminErrorResponses },
};

export const trustPublisherRouteSchema = {
  tags: TAG,
  params: numericIdParams,
  response: {
    200: z.object({
      data: z.object({ id: z.number(), handle: z.string().nullable() }),
    }),
    ...adminErrorResponses,
  },
};

/* ----------------------------------------------------------------- comments */

const listCommentsQuery = z.object({
  ...paginationSchema,
  projectId: z.coerce.number().int().positive().optional(),
  userId: z.string().optional(),
  q: z.string().trim().min(1).optional(),
  state: z.enum(adminCommentStateValues).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const listAdminCommentsRouteSchema = {
  tags: TAG,
  querystring: listCommentsQuery,
  response: {
    200: z.object({
      data: z.array(adminCommentSchema),
      meta: listMetaSchema,
    }),
    ...adminErrorResponses,
  },
};

type ListAdminCommentsGeneric = { Querystring: z.infer<typeof listCommentsQuery> };

export type ListAdminCommentsRequest = FastifyRequest<ListAdminCommentsGeneric>;
export type ListAdminCommentsReply = FastifyReply<ListAdminCommentsGeneric>;

export const hideCommentRouteSchema = {
  tags: TAG,
  params: numericIdParams,
  body: reasonBodySchema,
  response: {
    200: z.object({ data: z.object({ id: z.number() }) }),
    ...adminErrorResponses,
  },
};

export const unhideCommentRouteSchema = {
  tags: TAG,
  params: numericIdParams,
  response: {
    200: z.object({ data: z.object({ id: z.number() }) }),
    ...adminErrorResponses,
  },
};

export const deleteAdminCommentRouteSchema = {
  tags: TAG,
  params: numericIdParams,
  body: reasonBodySchema,
  response: { 204: z.null(), ...adminErrorResponses },
};

export const bulkCommentsRouteSchema = {
  tags: TAG,
  body: bulkCommentBodySchema,
  response: {
    200: z.object({ data: z.object({ affected: z.array(z.number()) }) }),
    ...adminErrorResponses,
  },
};

type BulkCommentsGeneric = { Body: z.infer<typeof bulkCommentBodySchema> };

export type BulkCommentsRequest = FastifyRequest<BulkCommentsGeneric>;
export type BulkCommentsReply = FastifyReply<BulkCommentsGeneric>;

/* -------------------------------------------------------------------- users */

const listUsersQuery = z.object({
  ...paginationSchema,
  q: z.string().trim().min(1).optional(),
  role: z.enum(userRoleValues).optional(),
  state: z.enum(["all", "banned", "hidden", "staff"]).optional(),
});

export const listAdminUsersRouteSchema = {
  tags: TAG,
  querystring: listUsersQuery,
  response: {
    200: z.object({ data: z.array(adminUserSchema), meta: listMetaSchema }),
    ...adminErrorResponses,
  },
};

type ListAdminUsersGeneric = { Querystring: z.infer<typeof listUsersQuery> };

export type ListAdminUsersRequest = FastifyRequest<ListAdminUsersGeneric>;
export type ListAdminUsersReply = FastifyReply<ListAdminUsersGeneric>;

export const getAdminUserRouteSchema = {
  tags: TAG,
  params: stringIdParams,
  response: {
    200: z.object({ data: adminUserDetailSchema }),
    ...adminErrorResponses,
  },
};

export const hideUserRouteSchema = {
  tags: TAG,
  params: stringIdParams,
  body: reasonBodySchema,
  response: {
    200: z.object({ data: z.object({ id: z.string() }) }),
    ...adminErrorResponses,
  },
};

export const unhideUserRouteSchema = {
  tags: TAG,
  params: stringIdParams,
  response: {
    200: z.object({ data: z.object({ id: z.string() }) }),
    ...adminErrorResponses,
  },
};

type StringIdGeneric = { Params: z.infer<typeof stringIdParams> };

export type StringIdRequest = FastifyRequest<StringIdGeneric>;
export type StringIdReply = FastifyReply<StringIdGeneric>;

type ReasonedStringGeneric = {
  Params: z.infer<typeof stringIdParams>;
  Body: z.infer<typeof reasonBodySchema>;
};

export type ReasonedStringRequest = FastifyRequest<ReasonedStringGeneric>;
export type ReasonedStringReply = FastifyReply<ReasonedStringGeneric>;

/* ------------------------------------------------------------------ reports */

const listReportsQuery = z.object({
  status: z.enum(reportStatusValues).optional(),
});

export const listReportsRouteSchema = {
  tags: TAG,
  querystring: listReportsQuery,
  response: {
    200: z.object({ data: z.array(reportGroupSchema) }),
    ...adminErrorResponses,
  },
};

type ListReportsGeneric = { Querystring: z.infer<typeof listReportsQuery> };

export type ListReportsRequest = FastifyRequest<ListReportsGeneric>;
export type ListReportsReply = FastifyReply<ListReportsGeneric>;

const resolveReportParams = z.object({
  targetType: z.enum(["project", "comment", "user"]),
  targetId: z.string().min(1).max(64),
});

export const resolveReportRouteSchema = {
  tags: TAG,
  params: resolveReportParams,
  body: resolveReportBodySchema,
  response: {
    200: z.object({ data: z.object({ resolved: z.number() }) }),
    ...adminErrorResponses,
  },
};

type ResolveReportGeneric = {
  Params: z.infer<typeof resolveReportParams>;
  Body: z.infer<typeof resolveReportBodySchema>;
};

export type ResolveReportRequest = FastifyRequest<ResolveReportGeneric>;
export type ResolveReportReply = FastifyReply<ResolveReportGeneric>;

/* --------------------------------------------------------------- categories */

export const listCategoriesRouteSchema = {
  tags: TAG,
  response: {
    200: z.object({ data: z.array(adminCategorySchema) }),
    ...adminErrorResponses,
  },
};

const categoryResult = z.object({
  data: z.object({ id: z.number(), key: z.string(), name: z.string() }),
});

export const createCategoryRouteSchema = {
  tags: TAG,
  body: createCategoryBodySchema,
  response: { 201: categoryResult, ...adminErrorResponses },
};

type CreateCategoryGeneric = {
  Body: z.infer<typeof createCategoryBodySchema>;
};

export type CreateCategoryRequest = FastifyRequest<CreateCategoryGeneric>;
export type CreateCategoryReply = FastifyReply<CreateCategoryGeneric>;

export const updateCategoryRouteSchema = {
  tags: TAG,
  params: numericIdParams,
  body: updateCategoryBodySchema,
  response: { 200: categoryResult, ...adminErrorResponses },
};

type UpdateCategoryGeneric = {
  Params: z.infer<typeof numericIdParams>;
  Body: z.infer<typeof updateCategoryBodySchema>;
};

export type UpdateCategoryRequest = FastifyRequest<UpdateCategoryGeneric>;
export type UpdateCategoryReply = FastifyReply<UpdateCategoryGeneric>;

/* -------------------------------------------------------------------- audit */

const listAuditQuery = z.object({
  ...paginationSchema,
  actorId: z.string().optional(),
  targetType: z.enum(moderationTargetValues).optional(),
  targetId: z.string().optional(),
  action: z.enum(moderationActionValues).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const listAuditRouteSchema = {
  tags: TAG,
  querystring: listAuditQuery,
  response: {
    200: z.object({ data: z.array(auditEntrySchema), meta: listMetaSchema }),
    ...adminErrorResponses,
  },
};

type ListAuditGeneric = { Querystring: z.infer<typeof listAuditQuery> };

export type ListAuditRequest = FastifyRequest<ListAuditGeneric>;
export type ListAuditReply = FastifyReply<ListAuditGeneric>;
