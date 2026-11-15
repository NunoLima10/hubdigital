import { z } from "zod";
import { projectMinimalSchema } from "./project-schema";
import { awardedBadgeSchema, badgeKeySchema } from "./badge-schema";

/**
 * Lowercase letters, digits and single dashes — it has to survive being typed
 * into a URL and read out loud.
 */
export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "O nome de utilizador precisa de pelo menos 3 caracteres.")
  .max(30, "O nome de utilizador é demasiado longo.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa apenas letras, números e traços.");

const optionalUrl = z
  .string()
  .trim()
  .url("Informa um link válido.")
  .max(300)
  .nullish()
  .or(z.literal(""));

export const makerProfileUpdateSchema = z.object({
  handle: handleSchema.optional(),
  bio: z.string().trim().min(1).max(500).optional(),
  websiteUrl: optionalUrl,
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  instagramUrl: optionalUrl,
  discordUrl: optionalUrl,
});

export const makerProfileSchema = z.object({
  id: z.number(),
  handle: z.string().nullable(),
  name: z.string(),
  image: z.string().nullable(),
  bio: z.string(),
  websiteUrl: z.string().nullable(),
  githubUrl: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  instagramUrl: z.string().nullable(),
  discordUrl: z.string().nullable(),
  /** Upvotes gathered across every project this maker has published. */
  totalUpvotes: z.number(),
  projectCount: z.number(),
  /** One-based position in which this maker joined the community. */
  membershipNumber: z.number().int().positive(),
  /** Every badge this maker holds, in catalog order. */
  badges: z.array(awardedBadgeSchema),
  /** The badge shown next to their name, or null when they hide it. */
  featuredBadge: badgeKeySchema.nullable(),
  joinedAt: z.string(),
  projects: z.array(projectMinimalSchema),
  ownedProjects: z.array(projectMinimalSchema),
  collaborations: z.array(
    projectMinimalSchema.extend({ contributionRole: z.string().nullable() }),
  ),
});

export type MakerProfile = z.infer<typeof makerProfileSchema>;
export type MakerProfileUpdate = z.infer<typeof makerProfileUpdateSchema>;
