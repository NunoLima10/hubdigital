import { z } from "zod";

const NODE_ENVS = ["development", "test", "production"] as const;

/** An optional variable left blank (`KEY=` in .env) counts as unset. */
const blankAsUnset = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

export const envSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVS).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z
    .string()
    .default("info")
    .describe("Logging level (e.g., info, debug, error)"),

  COOKIE_SECRET: z.string(),

  BETTER_AUTH_URL: z.string().url().default("http://localhost:3001"),
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
  // Reserved for GitHub sign-in, which is not offered yet: nothing reads them,
  // so a deploy must not fail for lacking them.
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Per account when signed in, per IP otherwise. A page load is about ten
  // requests, so 300 a minute leaves room for fast browsing on a shared IP.
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),

  // Which X-Forwarded-For hops to believe, as Fastify's trustProxy takes it:
  // "false" (direct, the default), "true" (any proxy), a hop count ("1"
  // behind one load balancer) or a comma-separated list of proxy IPs/CIDRs.
  // Wrong here means every visitor shares the proxy's IP, and one limit.
  TRUST_PROXY: z
    .string()
    .default("false")
    .transform(
      (raw): boolean | string[] | ((address: string, hop: number) => boolean) => {
        const value = raw.trim();
        if (value === "true") return true;
        if (value === "false" || value === "") return false;
        if (/^\d+$/.test(value)) {
          // Trust the nearest n hops, as proxy-addr reads a hop count.
          const hops = Number(value);
          return (_address, hop) => hop < hops;
        }
        return value.split(",").map((entry) => entry.trim()).filter(Boolean);
      },
    ),

  // Shared with the web app's server. Its server-side renders send it with the
  // visitor's IP, so they are limited per visitor rather than all together as
  // the web server's IP. Never exposed to browsers.
  API_INTERNAL_KEY: blankAsUnset(z.string().min(32)),

  CLOUDFLARE_PUBLIC_URL: z.string().url().optional(),
  CLOUDFLARE_BUCKET: z.string().optional(),
  CLOUDFLARE_ENDPOINT: z.string().url().optional(),
  CLOUDFLARE_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_ACCESS_KEY_SECRET: z.string().optional(),
  CLOUDFLARE_REGION: z.string().default("auto"),
  UPLOADER_URL_EXPIRES_IN: z.coerce.number().int().positive().default(300),
});

const env = envSchema.parse(process.env);

export const config = {
  ...env,
  isDev: env.NODE_ENV === "development",
  isProd: env.NODE_ENV === "production",
};

export type Config = typeof config;
