import { UserRole } from "@/lib/plugins/admin";
import { ForbiddenError, UnauthorizedAccessError } from "@/utils/custom-errors";
import { FastifyRequest } from "fastify";

/**
 * Missing session and wrong role are answered differently on purpose: the
 * first means "sign in", the second means "you may not", and the admin app
 * shows a different screen for each.
 */
export function hasAnyRole(...roles: UserRole[]) {
  return async function (req: FastifyRequest) {
    if (!req.user) throw new UnauthorizedAccessError();

    if (!roles.includes(req.user.role)) throw new ForbiddenError();
  };
}

/** The guard on every `/v1/admin` route. */
export const requireAdmin = hasAnyRole("admin");
