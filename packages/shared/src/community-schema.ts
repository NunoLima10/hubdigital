import { z } from "zod";
export const announcementKindValues = ["presentation", "first_release", "major_update"] as const;
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
  status: z.enum(["pending", "published", "rejected"]),
  publishedAt: z.string().nullable(),
  week: z.string().nullable(),
  rejectionReason: z.string().nullable().optional(),
  votes: z.number(),
  hasVoted: z.boolean(),
  project: z.object({ name: z.string(), slug: z.string(), logoUrl: z.string().nullable() }),
});
export type Announcement = z.infer<typeof announcementSchema>;
export const makerMembershipSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  status: z.enum(["pending", "accepted"]),
  userId: z.string(),
  name: z.string(),
  handle: z.string().nullable(),
  image: z.string().nullable(),
});
export type MakerMembership = z.infer<typeof makerMembershipSchema>;
