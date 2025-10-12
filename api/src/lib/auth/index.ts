import { config } from "@/config";
import { db } from "@/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin } from "better-auth/plugins";
import { ROLES_AC, ac as ADMIN_AC, ADMIN_ROLES } from "./plugins/admin";

export const auth = betterAuth({
  baseURL: config.BETTER_AUTH_URL,
  secret: config.BETTER_AUTH_SECRET,
  basePath: "/v1/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  socialProviders: {
    // google: {
    //   clientId: config.GOOGLE_CLIENT_ID,
    //   clientSecret: config.GOOGLE_CLIENT_SECRET,
    // },
    // github: {
    //   clientId: config.GITHUB_CLIENT_ID,
    //   clientSecret: config.GITHUB_CLIENT_SECRET
    // }
  },
  plugins: [
    adminPlugin({
      defaultRole: "user",
      adminRoles: ADMIN_ROLES,
      ac: ADMIN_AC,
      roles: ROLES_AC,
    }),
  ],
  advanced: {
    defaultCookieAttributes: {
      secure: true,
      httpOnly: true,
      sameSite: "none",
      path: "/",
    },
  },
  session: {
    cookieCache: {
      enabled: false,
    },
  },
  user: {
    additionalFields: {
      onboardingComplete: {
        type: "boolean",
        required: false,
        defaultValue: null,
        input: false, // don't allow user to set role
      },
    },
  },
});
