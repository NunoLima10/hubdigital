import { UnauthorizedAccessError } from '@/utils/custom-errors';
import { FastifyRequest } from 'fastify';

export async function authenticate(req: FastifyRequest) {
  const user = req.user;

  if (!user) {
    throw new UnauthorizedAccessError();
  }
}
