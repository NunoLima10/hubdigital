import { endpoints } from "@/api/endpoints";
import { env } from "@/app/env";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.API_URL + endpoints.auth,
  plugins: [],
});
