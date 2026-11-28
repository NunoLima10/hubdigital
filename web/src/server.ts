// Worker entry point (wrangler.jsonc "main"). It wraps TanStack Start's
// default handler so Worker-only handlers — scheduled (Cron Triggers), queue,
// Durable Object classes — can be added next to fetch later.
// https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/
import handler from "@tanstack/react-start/server-entry";

type WorkerEnv = {
  /** API origin to proxy /v1/* to, e.g. https://api.example.com. Unset: no proxy. */
  API_PROXY_TARGET?: string;
  API_INTERNAL_KEY?: string;
};

const API_PREFIX = "/v1";

// PostHog reverse proxy (EU cloud). The browser SDK posts to /ingest on this
// origin (VITE_APP_POSTHOG_HOST=/ingest), which ad blockers leave alone.
const POSTHOG_PREFIX = "/ingest";
const POSTHOG_API_HOST = "https://eu.i.posthog.com";
const POSTHOG_ASSET_HOST = "https://eu-assets.i.posthog.com";

/**
 * Serves the API under this site's own origin. While the site and the API sit
 * on unrelated domains (workers.dev and railway.app), browsers treat the API's
 * auth cookies as third-party and drop them — Google sign-in then fails with
 * state_mismatch. Through the proxy every cookie is first-party.
 */
function proxyToApi(request: Request, env: WorkerEnv, target: string) {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  // A browser must not pass itself off as our server-side render.
  headers.delete("x-internal-key");
  headers.delete("x-client-ip");
  // The API sees the Worker's address; with the shared key it rate-limits per
  // visitor instead (api/src/utils/request-client.ts).
  const visitorIp = request.headers.get("cf-connecting-ip");
  if (env.API_INTERNAL_KEY && visitorIp) {
    headers.set("x-internal-key", env.API_INTERNAL_KEY);
    headers.set("x-client-ip", visitorIp);
  }
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  return fetch(new URL(url.pathname + url.search, target), {
    method: request.method,
    headers,
    body: hasBody ? request.body : null,
    // Hand redirects (the OAuth callback's) to the browser, not follow them.
    redirect: "manual",
  });
}

/**
 * Forwards /ingest/* to PostHog. The site's own cookies (the session) are
 * stripped: PostHog needs none of them. The visitor's IP is passed on so
 * country-level geolocation still works; the project discards the IP itself.
 */
async function proxyToPosthog(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.slice(POSTHOG_PREFIX.length) || "/";
  const host = path.startsWith("/static/") ? POSTHOG_ASSET_HOST : POSTHOG_API_HOST;
  const destination = new URL(host);
  destination.pathname = path;
  destination.search = url.search;
  const headers = new Headers(request.headers);
  headers.delete("cookie");
  headers.delete("authorization");
  headers.delete("host");
  const visitorIp = request.headers.get("cf-connecting-ip");
  if (visitorIp) headers.set("x-forwarded-for", visitorIp);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const response = await fetch(destination, {
    method: request.method,
    headers,
    body: hasBody ? request.body : null,
    redirect: "manual",
  });
  if (response.status >= 300 && response.status < 400 && response.headers.has("location")) {
    await response.body?.cancel();
    return new Response(null, { status: 502 });
  }
  return response;
}

export default {
  fetch(request: Request, env: WorkerEnv) {
    const { pathname } = new URL(request.url);
    if (pathname === POSTHOG_PREFIX || pathname.startsWith(`${POSTHOG_PREFIX}/`)) {
      return proxyToPosthog(request);
    }
    const target = env.API_PROXY_TARGET;
    if (target && (pathname === API_PREFIX || pathname.startsWith(`${API_PREFIX}/`))) {
      return proxyToApi(request, env, target);
    }
    return handler.fetch(request);
  },
};
