import { CookieSerializeOptions } from "@fastify/cookie";
import { env } from "@/utils/env";

export const cookies: {
  [key: string]: { opts: CookieSerializeOptions; key: string };
} = {
  refreshToken: {
    opts: {
      path: "/",
      httpOnly: env.NODE_ENV === "production",
      signed: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
    },
    key: "refreshToken",
  },
};
