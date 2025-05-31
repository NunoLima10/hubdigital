import zennv from "zennv";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),

  DATABASE_URL: z.string(),
  DB_MIGRATING: z.boolean().default(false),
  DB_SEEDING: z.boolean().default(false),

  ALLOWED_ORIGINS: z
    .string()
    .transform((val) => val.split(","))
    .describe("Comma-separated list of allowed CORS origins"),

  COOKIE_SECRET: z
    .string()
    .default("cookie-jwt")
    .describe("Secret for signing cookies"),
  CLERK_PUBLISHABLE_KEY: z.string().describe("Clerk API publishable key"),
  CLERK_SECRET_KEY: z.string().describe("Clerk API secret key"),
});

export const env = zennv({
  dotenv: true,
  schema: envSchema,
});
