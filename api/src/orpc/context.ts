import type { DB } from "@/db";
import type { User } from "@/plugins/better-auth";
import type { FastifyRequest } from "fastify";

export type Context = {
  db: DB;
  user: User;
  req: FastifyRequest;
};
