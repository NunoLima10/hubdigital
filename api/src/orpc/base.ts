import { ORPCError, os } from "@orpc/server";
import type { Context } from "./context";

export const pub = os.$context<Context>();

export const authed = pub.use(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({ context: { ...context, user: context.user } });
});
