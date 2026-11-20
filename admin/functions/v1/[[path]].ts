// Cloudflare Pages Function: serves the API under the admin's own origin at
// /v1/*. While the admin and the API sit on unrelated domains (pages.dev and
// railway.app), browsers treat the API's session cookie as third-party and
// drop it — sign-in succeeds but get-session comes back null. Through this
// proxy every cookie is first-party. Same idea as web/src/server.ts.
//
// Pages runs Functions before static assets and public/_redirects, so the SPA
// fallback (/* /index.html 200) never catches /v1/*.
//
// Pages project settings → Environment variables (production):
//   API_PROXY_TARGET  API origin, e.g. https://api.example.com (no /v1)
//   API_INTERNAL_KEY  optional secret, same value as the API's, so the API
//                     rate-limits per visitor instead of per Cloudflare IP
// And build with VITE_APP_API_URL=https://<admin origin>/v1.

type Env = {
  API_PROXY_TARGET?: string;
  API_INTERNAL_KEY?: string;
};

type Context = {
  request: Request;
  env: Env;
};

export async function onRequest({ request, env }: Context): Promise<Response> {
  const target = env.API_PROXY_TARGET;
  if (!target) {
    return new Response("API_PROXY_TARGET is not configured", { status: 502 });
  }

  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  // A browser must not pass itself off as a trusted server-side caller.
  headers.delete("x-internal-key");
  headers.delete("x-client-ip");
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
