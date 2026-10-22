import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

/**
 * Headers a server-side render adds to its API calls. Every render reaches the
 * API from the web server's address, so it would share one rate limit with
 * every other visitor; with the shared key the API instead counts it against
 * the visitor's IP, which Cloudflare sets in cf-connecting-ip and a visitor
 * cannot forge. In the browser, and without API_INTERNAL_KEY, it adds nothing.
 *
 * The key is a Worker secret (`wrangler secret put API_INTERNAL_KEY`, or
 * .dev.vars locally), read from process.env on the server only, so it never
 * reaches the browser bundle.
 */
export const ssrApiHeaders = createIsomorphicFn()
  .server((): Record<string, string> => {
    // nodejs_compat (wrangler.jsonc) fills process.env with the Worker's
    // secrets; the web app has no Node typings, hence the narrow cast.
    const { process } = globalThis as { process?: { env: Record<string, string | undefined> } };
    const key = process?.env.API_INTERNAL_KEY;
    if (!key) return {};
    const visitorIp = getRequestHeader("cf-connecting-ip");
    return {
      "x-internal-key": key,
      ...(visitorIp ? { "x-client-ip": visitorIp } : {}),
    };
  })
  .client((): Record<string, string> => ({}));
