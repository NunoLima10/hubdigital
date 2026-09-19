import { z } from "zod";
import { projectMinimalSchema } from "./project-schema";

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
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Usa apenas letras, números e traços."
  );

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
  /** Upvotes gathered across every project this maker has published. */
  totalUpvotes: z.number(),
  projectCount: z.number(),
  joinedAt: z.string(),
  projects: z.array(projectMinimalSchema),
});

export type MakerProfile = z.infer<typeof makerProfileSchema>;
export type MakerProfileUpdate = z.infer<typeof makerProfileUpdateSchema>;
