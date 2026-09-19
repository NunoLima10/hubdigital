import { z } from "zod";
import {
  MODERATION_BULK_MAX,
  MODERATION_REASON_MAX,
  MODERATION_REASON_MIN,
  moderationTargetValues,
  reportReasonValues,
  reportStatusValues,
  reportTargetValues,
} from "./moderation";
import { locationSchema } from "./location-schema";
import { projectStatusValues } from "./project-status";
import { categorySummarySchema, projectAuthorSchema } from "./project-schema";
import { userRoleValues } from "./roles";

/**
 * Every sanction carries a written reason. It is mandatory because the person
 * on the receiving end is shown it — see specs/ADMIN.md §A4.
 */
export const moderationReasonSchema = z
  .string()
  .trim()
  .min(
    MODERATION_REASON_MIN,
    `Explique o motivo em pelo menos ${MODERATION_REASON_MIN} caracteres.`
  )
  .max(MODERATION_REASON_MAX);

export const reasonBodySchema = z.object({ reason: moderationReasonSchema });

export const optionalNoteBodySchema = z.object({
  note: z.string().trim().max(MODERATION_REASON_MAX).optional(),
});

/* ------------------------------------------------------------------ settings */

export const settingsSchema = z.object({
  "moderation.review_required": z.boolean(),
  "moderation.auto_approve_trusted": z.boolean(),
  "submissions.open": z.boolean(),
  "announcement.text": z.string().max(280).nullable(),
});

export const settingsPatchSchema = settingsSchema.partial();

export const publicSettingsSchema = settingsSchema.pick({
  "submissions.open": true,
  "announcement.text": true,
});

export type Settings = z.infer<typeof settingsSchema>;
export type SettingsPatch = z.infer<typeof settingsPatchSchema>;
export type PublicSettings = z.infer<typeof publicSettingsSchema>;

/* --------------------------------------------------------------------- audit */

export const auditActorSchema = z.object({
  id: z.string().nullable(),
  name: z.string(),
  email: z.string().nullable(),
});

export const auditEntrySchema = z.object({
  id: z.number(),
  action: z.string(),
  targetType: z.enum(moderationTargetValues),
  targetId: z.string(),
  reason: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.string(),
  actor: auditActorSchema,
});

export type AuditEntryView = z.infer<typeof auditEntrySchema>;

/* ------------------------------------------------------------ admin projects */

export const adminPublisherSchema = z.object({
  id: z.number(),
  handle: z.string().nullable(),
  bio: z.string(),
  trustedAt: z.string().nullable(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable(),
    banned: z.boolean().nullable(),
    shadowBannedAt: z.string().nullable(),
  }),
});

export const adminProjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  shortDescription: z.string(),
  description: z.string().nullable(),
  websiteUrl: z.string(),
  githubUrl: z.string().nullable(),
  logoUrl: z.string().nullable(),
  bannerImageUrl: z.string().nullable(),
  location: locationSchema.nullable(),
  categoryId: z.number(),
  category: categorySummarySchema.nullable(),
  publisher: adminPublisherSchema.nullable(),
  status: z.enum(projectStatusValues),
  upvoteCount: z.number(),
  commentCount: z.number(),
  queuedAt: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  shadowBannedAt: z.string().nullable(),
  shadowBanReason: z.string().nullable(),
  publishedAt: z.string().nullable(),
  launchedAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminProject = z.infer<typeof adminProjectSchema>;

export const adminProjectDetailSchema = adminProjectSchema.extend({
  history: z.array(auditEntrySchema),
});

export type AdminProjectDetail = z.infer<typeof adminProjectDetailSchema>;

/* ------------------------------------------------------------ admin comments */

export const adminCommentStateValues = [
  "visible",
  "hidden",
  "deleted",
] as const;

export type AdminCommentState = (typeof adminCommentStateValues)[number];

export const adminCommentSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  projectName: z.string(),
  projectSlug: z.string(),
  parentId: z.number().nullable(),
  body: z.string(),
  state: z.enum(adminCommentStateValues),
  moderationReason: z.string().nullable(),
  author: projectAuthorSchema.nullable(),
  authorShadowBanned: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdminComment = z.infer<typeof adminCommentSchema>;

export const bulkCommentBodySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(MODERATION_BULK_MAX),
  action: z.enum(["hide", "delete"]),
  reason: moderationReasonSchema,
});

/* --------------------------------------------------------------- admin users */

export const adminUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  role: z.enum(userRoleValues).nullable(),
  banned: z.boolean().nullable(),
  banReason: z.string().nullable(),
  banExpires: z.string().nullable(),
  shadowBannedAt: z.string().nullable(),
  shadowBanReason: z.string().nullable(),
  onboardedAt: z.string().nullable(),
  handle: z.string().nullable(),
  projectCount: z.number(),
  commentCount: z.number(),
  upvoteCount: z.number(),
  createdAt: z.string(),
});

export type AdminUser = z.infer<typeof adminUserSchema>;

export const adminUserDetailSchema = adminUserSchema.extend({
  publisher: z
    .object({
      id: z.number(),
      bio: z.string(),
      websiteUrl: z.string().nullable(),
      githubUrl: z.string().nullable(),
      linkedinUrl: z.string().nullable(),
      trustedAt: z.string().nullable(),
    })
    .nullable(),
  projects: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
      status: z.enum(projectStatusValues),
      shadowBannedAt: z.string().nullable(),
      createdAt: z.string(),
    })
  ),
  history: z.array(auditEntrySchema),
});

export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;

/* ------------------------------------------------------------------- reports */

export const createReportBodySchema = z.object({
  targetType: z.enum(reportTargetValues),
  targetId: z.string().min(1).max(64),
  reason: z.enum(reportReasonValues),
  details: z.string().trim().max(MODERATION_REASON_MAX).optional(),
});

export type CreateReportBody = z.infer<typeof createReportBodySchema>;

export const reportGroupSchema = z.object({
  targetType: z.enum(reportTargetValues),
  targetId: z.string(),
  reportCount: z.number(),
  openCount: z.number(),
  status: z.enum(reportStatusValues),
  reasons: z.array(z.enum(reportReasonValues)),
  latestAt: z.string(),
  latestDetails: z.string().nullable(),
  /** Enough to render the row without a second request. */
  targetLabel: z.string().nullable(),
  targetHref: z.string().nullable(),
  reportIds: z.array(z.number()),
});

export type ReportGroup = z.infer<typeof reportGroupSchema>;

export const resolveReportBodySchema = z.object({
  outcome: z.enum(["resolved", "dismissed"]),
  note: z.string().trim().max(MODERATION_REASON_MAX).optional(),
});

/* ---------------------------------------------------------------- categories */

export const adminCategorySchema = z.object({
  id: z.number(),
  key: z.string(),
  name: z.string(),
  projectCount: z.number(),
  createdAt: z.string(),
});

export type AdminCategory = z.infer<typeof adminCategorySchema>;

export const createCategoryBodySchema = z.object({
  /** Stable identifier used by the seed and by any external reference. */
  key: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_]+$/, "Use apenas minúsculas, números e underscore."),
  name: z.string().trim().min(2).max(80),
});

export const updateCategoryBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
});

/* --------------------------------------------------------------------- stats */

export const adminStatsSchema = z.object({
  queue: z.object({
    pending: z.number(),
    oldestQueuedAt: z.string().nullable(),
  }),
  openReports: z.number(),
  hiddenProjects: z.number(),
  hiddenUsers: z.number(),
  last7: z.object({
    signups: z.number(),
    submissions: z.number(),
    publishes: z.number(),
    comments: z.number(),
    upvotes: z.number(),
  }),
  previous7: z.object({
    signups: z.number(),
    submissions: z.number(),
    publishes: z.number(),
    comments: z.number(),
    upvotes: z.number(),
  }),
  totals: z.object({
    users: z.number(),
    publishers: z.number(),
    projects: z.number(),
    published: z.number(),
  }),
});

export type AdminStats = z.infer<typeof adminStatsSchema>;
