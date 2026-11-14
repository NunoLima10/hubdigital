import { config } from "@/config";
import { FastifyRequest } from "fastify";
import { timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

export const INTERNAL_KEY_HEADER = "x-internal-key";
export const CLIENT_IP_HEADER = "x-client-ip";

function header(req: FastifyRequest, name: string) {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

/** Whether the request comes from our own web server, by its shared key. */
export function isInternalRequest(req: FastifyRequest) {
  const expected = config.API_INTERNAL_KEY;
  const given = header(req, INTERNAL_KEY_HEADER);
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * The visitor's IP. For a server-side render it is the one the web server
 * forwards — req.ip there is the web server itself — and it is only believed
 * alongside the internal key, so a browser cannot pick its own.
 */
export function clientIp(req: FastifyRequest) {
  if (isInternalRequest(req)) {
    const forwarded = header(req, CLIENT_IP_HEADER)?.trim();
    if (forwarded && isIP(forwarded)) return forwarded;
  }
  return req.ip;
}

/**
 * Who a rate limit counts against: the account when signed in, so people
 * sharing an IP (an office, a carrier's NAT) do not throttle each other, and
 * the visitor's IP otherwise.
 */
export function rateLimitKey(req: FastifyRequest) {
  return req.user ? `user:${req.user.id}` : `ip:${clientIp(req)}`;
}

/**
 * A render by our web server that could not say who it renders for (no
 * visitor IP, as in local development) is not throttled: bucketing it would
 * put every visitor in one shared limit.
 */
export function isUnattributedInternalRequest(req: FastifyRequest) {
  return isInternalRequest(req) && !isIP(header(req, CLIENT_IP_HEADER)?.trim() ?? "");
}
