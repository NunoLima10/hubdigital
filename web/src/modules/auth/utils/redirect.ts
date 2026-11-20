import { z } from "zod";

export const DEFAULT_SIGNED_IN_PATH = "/dashboard/releases";

const AUTH_PATHS = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];

/**
 * Only same-site paths are accepted, so `?redirect=` cannot bounce someone to
 * another origin ("//evil.com", "/\\evil.com", "https://…"), and the auth
 * screens themselves are dropped so a sign-in never lands back on a form.
 */
export function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return undefined;
  }
  const pathname = value.split(/[?#]/, 1)[0];
  if (AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return undefined;
  }
  return value;
}

/** `?redirect=` on the auth routes: where to go back to after signing in. */
export const authRedirectSearchSchema = z.object({
  redirect: z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) => safeRedirect(value)),
});
