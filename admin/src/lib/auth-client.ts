import { endpoints } from "@/api/endpoints";
import { env } from "@/app/env";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * The admin plugin gives this app Better Auth's own user administration —
 * listUsers, setRole, banUser, revokeUserSessions — without the API having to
 * reimplement any of it. The server decides who may call those; this only adds
 * the typed client methods.
 */
export const authClient = createAuthClient({
  baseURL: env.API_URL + endpoints.auth,
  plugins: [adminClient()],
});
