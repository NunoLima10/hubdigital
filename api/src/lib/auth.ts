import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { config } from "@/config";
import { admin as adminPlugin } from "better-auth/plugins";
import { ROLES_AC, ac as ADMIN_AC, ADMIN_ROLES } from "./plugins/admin";

const authConfig = {
  baseURL: config.BETTER_AUTH_URL,
  secret: config.BETTER_AUTH_SECRET,
  basePath: "/v1/auth",
  database: drizzleAdapter(db, { provider: "pg", usePlural: true }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  plugins: [
    adminPlugin({
      defaultRole: "user",
      adminRoles: ADMIN_ROLES,
      ac: ADMIN_AC,
      roles: ROLES_AC,
    }),
  ],
  user: {
    additionalFields: {
      onboardedAt: {
        type: "date",
        required: false,
      },
    },
  },
} satisfies BetterAuthOptions;

export const auth = betterAuth(authConfig) as ReturnType<
  typeof betterAuth<typeof authConfig>
>;

