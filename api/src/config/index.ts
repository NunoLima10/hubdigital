import { z } from "zod";

const NODE_ENVS = ["development", "test", "production"] as const;

export const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVS).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z
    .string()
    .default("info")
    .describe("Logging level (e.g., info, debug, error)"),

  COOKIE_SECRET: z.string(),

  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters long"),

  ALLOWED_ORIGINS: z
    .string()
    .optional()
    .transform(
      (raw) =>
        raw
          ?.split(",")
          .map((origin) => origin.trim())
          .filter(Boolean) ?? []
    ),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DB_MIGRATING: z.coerce.boolean().default(false),
  DB_SEEDING: z.coerce.boolean().default(false),

  ADMIN_SEED_NAME: z.string().optional(),
  ADMIN_SEED_EMAIL: z.string().email().optional(),
  ADMIN_SEED_PASSWORD: z.string().min(8).optional(),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),

  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
});

const env = envSchema.parse(process.env);

export const config = {
  ...env,
  isDev: env.NODE_ENV === "development",
  isProd: env.NODE_ENV === "production",
};

export type Config = typeof config;
