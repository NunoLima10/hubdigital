import { z } from "zod";

const NODE_ENVS = ["development", "test", "production"] as const;

/** An optional variable left blank (`KEY=` in .env) counts as unset. */
const blankAsUnset = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

/** A true/false flag; blank or unset is false. */
const envFlag = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim().replace(/^["']|["']$/g, "");
    return trimmed === "" ? undefined : trimmed;
  },
  z.stringbool().default(false),
);

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
  // stringbool, not coerce.boolean: coercion turns the string "false" into true.
  // Trimmed, and blank counts as unset, so `DB_SEEDING=` can't stop the API booting.
  DB_MIGRATING: envFlag,
  DB_SEEDING: envFlag,

  ADMIN_SEED_NAME: blankAsUnset(z.string()),
  ADMIN_SEED_EMAIL: blankAsUnset(z.string().email()),
  ADMIN_SEED_PASSWORD: blankAsUnset(z.string().min(8)),

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

  // PostHog product analytics (src/lib/analytics.ts). Unset: nothing is sent.
  // The project token (phc_...) is the same one the web app uses.
  POSTHOG_API_KEY: blankAsUnset(z.string()),
  POSTHOG_HOST: z.string().url().default("https://eu.i.posthog.com"),
  // Reading from PostHog (src/lib/posthog-query.ts) for the public site stats.
  // A personal API key with only the query:read scope; never sent to browsers.
  // The app host is PostHog's private API, not the ingestion host above.
  POSTHOG_PERSONAL_API_KEY: blankAsUnset(z.string()),
  POSTHOG_PROJECT_ID: blankAsUnset(z.string()),
  POSTHOG_APP_HOST: z.string().url().default("https://eu.posthog.com"),

  CLOUDFLARE_PUBLIC_URL: blankAsUnset(z.string().url()),
  CLOUDFLARE_BUCKET: blankAsUnset(z.string()),
  CLOUDFLARE_ENDPOINT: blankAsUnset(z.string().url()),
  CLOUDFLARE_ACCESS_KEY_ID: blankAsUnset(z.string()),
  CLOUDFLARE_ACCESS_KEY_SECRET: blankAsUnset(z.string()),
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
