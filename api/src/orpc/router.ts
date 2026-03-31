import { os } from "@orpc/server";
import type { RouterClient } from "@orpc/server";
import { usersRouter } from "./users/router";

export const appRouter = os.$context<import("./context").Context>().router({
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<AppRouter>;
