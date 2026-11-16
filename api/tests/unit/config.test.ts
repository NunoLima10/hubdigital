import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import { describe, expect, it } from "vitest";
import { envSchema } from "../../src/config";

const example = parseEnv(readFileSync(resolve(__dirname, "../../.env.example"), "utf8"));

describe("contributor environment", () => {
  it("accepts the example with optional integrations left blank", () => {
    const config = envSchema.parse(example);
    expect(config.ADMIN_SEED_EMAIL).toBeUndefined();
    expect(config.ADMIN_SEED_PASSWORD).toBeUndefined();
    expect(config.CLOUDFLARE_ENDPOINT).toBeUndefined();
    expect(config.CLOUDFLARE_PUBLIC_URL).toBeUndefined();
    expect(config.ALLOWED_ORIGINS).toContain("http://localhost:5174");
  });

  it.each([
    ["ADMIN_SEED_EMAIL", "invalid-email"],
    ["ADMIN_SEED_PASSWORD", "short"],
    ["CLOUDFLARE_ENDPOINT", "invalid-url"],
    ["CLOUDFLARE_PUBLIC_URL", "invalid-url"],
  ])("still rejects invalid configured values for %s", (key, value) => {
    expect(envSchema.safeParse({ ...example, [key]: value }).success).toBe(false);
  });
});
