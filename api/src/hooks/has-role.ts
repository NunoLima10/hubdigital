import { UserRole } from '@/lib/auth/plugins/admin';
import { ForbiddenError } from '@/utils/custom-errors';
import { FastifyRequest } from 'fastify';

export function hasRole(role: UserRole) {
  return async function (req: FastifyRequest) {
    const user = req.user;
    if (user?.role !== role) throw new ForbiddenError();
  };
}
