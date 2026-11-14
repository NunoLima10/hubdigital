process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? "silent";
process.env.COOKIE_SECRET = process.env.COOKIE_SECRET ?? "test-cookie-secret";
process.env.BETTER_AUTH_URL =
  process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
process.env.BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET ?? "test-better-auth-secret-1234567890";
process.env.GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ?? "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET ?? "test-google-client-secret";
process.env.GITHUB_CLIENT_ID =
  process.env.GITHUB_CLIENT_ID ?? "test-github-client-id";
process.env.GITHUB_CLIENT_SECRET =
  process.env.GITHUB_CLIENT_SECRET ?? "test-github-client-secret";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgres://test-user:test-password@localhost:5432/test-db";

process.env.CLOUDFLARE_PUBLIC_URL =
  process.env.CLOUDFLARE_PUBLIC_URL ?? "https://assets.test.hubdigital.cv";
process.env.CLOUDFLARE_BUCKET = process.env.CLOUDFLARE_BUCKET ?? "test-bucket";
process.env.CLOUDFLARE_ENDPOINT =
  process.env.CLOUDFLARE_ENDPOINT ?? "https://test-account.r2.cloudflarestorage.com";
process.env.CLOUDFLARE_ACCESS_KEY_ID =
  process.env.CLOUDFLARE_ACCESS_KEY_ID ?? "test-access-key-id";
process.env.CLOUDFLARE_ACCESS_KEY_SECRET =
  process.env.CLOUDFLARE_ACCESS_KEY_SECRET ?? "test-access-key-secret";
