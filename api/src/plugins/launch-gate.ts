import { config } from "@/config";
import { getLaunchGate } from "@/lib/launch-gate";
import { isStaffRole } from "@hubdigital/shared";
import { FastifyInstance, FastifyRequest } from "fastify";
import fastifyPlugin from "fastify-plugin";

/**
 * The API side of the pre-launch lock (see src/lib/launch-gate.ts). While the
 * `launch-gate` flag is on, an onRequest hook answers 503 to everyone who
 * isn't staff, whatever the client: the web hides the site, and this makes
 * sure a hand-made request gets nothing either — no sign-up, no sign-in, no
 * data.
 *
 * Staff keep working: the session is already resolved (registered after the
 * better-auth plugin), and the admin app may sign in with email from its own
 * origin. A forged Origin only gets a session for an account that still
 * can't read anything past this hook unless it is staff.
 *
 * It answers directly instead of throwing so the error handler doesn't post a
 * "server error" to Discord for each refused request.
 */

/** Always reachable: health probes and the status the web needs to render. */
const ALWAYS_OPEN = new Set(["/healthcheck", "/v1/launch-status"]);

/** Auth endpoints anyone may call while locked (they grant nothing). */
const OPEN_AUTH = new Set(["/v1/auth/get-session", "/v1/auth/sign-out"]);

/** What the admin app needs to sign in, from its own origin only. */
const ADMIN_AUTH = new Set(["/v1/auth/sign-in/email"]);

const adminOrigin = new URL(config.ADMIN_URL).origin;

export function isAllowedWhileLocked(req: Pick<FastifyRequest, "method" | "url" | "headers" | "user">) {
  if (req.method === "OPTIONS") return true;
  const path = req.url.split("?")[0].replace(/\/+$/, "") || "/";
  if (ALWAYS_OPEN.has(path) || OPEN_AUTH.has(path)) return true;
  if (req.user && isStaffRole(req.user.role)) return true;
  return ADMIN_AUTH.has(path) && req.headers.origin === adminOrigin;
}

const launchGatePlugin = async (fastify: FastifyInstance) => {
  fastify.addHook("onRequest", async (req, reply) => {
    if (isAllowedWhileLocked(req)) return;

    const gate = await getLaunchGate();
    if (!gate.locked) return;

    return reply.code(503).header("Retry-After", "300").send({
      error: {
        message: "O Hub Digital ainda não abriu. Volta em breve.",
        code: "FST_SITE_LOCKED",
      },
    });
  });
};

export default fastifyPlugin(launchGatePlugin, {
  name: "launch-gate",
  dependencies: ["better-auth"],
});
