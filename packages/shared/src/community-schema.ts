import { z } from "zod";
export const announcementKindValues = [
  "presentation",
  "first_release",
  "major_update",
] as const;
export type AnnouncementKind = (typeof announcementKindValues)[number];
export const announcementStatusValues = [
  "pending",
  "published",
  "rejected",
] as const;
export type AnnouncementStatus = (typeof announcementStatusValues)[number];
export const projectMemberStatusValues = [
  "pending",
  "accepted",
  "declined",
] as const;
export type ProjectMemberStatus = (typeof projectMemberStatusValues)[number];
export const announcementKindLabels = {
  presentation: "Apresentação",
  first_release: "Primeira versão",
  major_update: "Atualização importante",
} as const;
export const announcementBodySchema = z.object({
  kind: z.enum(announcementKindValues),
  introduction: z.string().trim().min(10).max(1000),
  creationKey: z.string().uuid(),
});
export const announcementSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  kind: z.enum(announcementKindValues),
  introduction: z.string(),
  status: z.enum(announcementStatusValues),
  publishedAt: z.string().nullable(),
  week: z.string().nullable(),
  rejectionReason: z.string().nullable().optional(),
  votes: z.number(),
  hasVoted: z.boolean(),
  project: z.object({
    name: z.string(),
    slug: z.string(),
    logoUrl: z.string().nullable(),
  }),
});
export type Announcement = z.infer<typeof announcementSchema>;
export const projectMemberSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  status: z.enum(projectMemberStatusValues),
  userId: z.string(),
  name: z.string(),
  handle: z.string().nullable(),
  image: z.string().nullable(),
  role: z.string().nullable(),
});
export const memberContributionRoleSchema = z.string().trim().min(2).max(80);
export type ProjectMember = z.infer<typeof projectMemberSchema>;

const invitationPersonSchema = z.object({
  userId: z.string(),
  name: z.string(),
  handle: z.string().nullable(),
  image: z.string().nullable(),
});
const invitationProjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().nullable(),
});
/** An invitation the signed-in user received to join a project team. */
export const receivedInvitationSchema = z.object({
  id: z.number(),
  role: z.string().nullable(),
  createdAt: z.string(),
  project: invitationProjectSchema,
  invitedBy: invitationPersonSchema.nullable(),
});
export type ReceivedInvitation = z.infer<typeof receivedInvitationSchema>;
/** An invitation the signed-in user sent for one of their projects. */
export const sentInvitationSchema = z.object({
  id: z.number(),
  role: z.string().nullable(),
  status: z.enum(projectMemberStatusValues),
  createdAt: z.string(),
  project: invitationProjectSchema,
  invitee: invitationPersonSchema,
});
export type SentInvitation = z.infer<typeof sentInvitationSchema>;
