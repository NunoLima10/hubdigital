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
// nodejs_compat (wrangler.jsonc) fills process.env with the Worker's vars and
// secrets; the web app has no Node typings, hence the narrow cast.
const workerEnv = () =>
  (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env;

/**
 * The API base URL a server-side render calls. When the Worker proxies the API
 * under its own origin (API_PROXY_TARGET, src/server.ts), the render goes
 * straight to the API instead of round-tripping through its own public URL.
 */
export const ssrApiBaseUrl = createIsomorphicFn()
  .server((baseUrl: string) => {
    const target = workerEnv()?.API_PROXY_TARGET;
    if (!target) return baseUrl;
    const { pathname } = new URL(baseUrl);
    return new URL(pathname, target).toString().replace(/\/$/, "");
  })
  .client((baseUrl: string) => baseUrl);

export const ssrApiHeaders = createIsomorphicFn()
  .server((): Record<string, string> => {
    const key = workerEnv()?.API_INTERNAL_KEY;
    if (!key) return {};
    const visitorIp = getRequestHeader("cf-connecting-ip");
    return {
      "x-internal-key": key,
      ...(visitorIp ? { "x-client-ip": visitorIp } : {}),
    };
  })
  .client((): Record<string, string> => ({}));
