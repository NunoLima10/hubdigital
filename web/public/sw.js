// Hub Digital service worker. Hand-written on purpose: the site is server
// rendered with signed-in state, so pages always come from the network and
// fall back to /offline.html when offline. Only static files are cached.
// Bump VERSION to drop every old cache on the next visit.
const VERSION = "v1";
const STATIC_CACHE = `hubdigital-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Never handled by the worker: API (auth cookies), analytics proxy, server functions.
const BYPASS_PREFIXES = ["/v1", "/ingest", "/_serverFn", "/api"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE]);
      for (const key of await caches.keys()) {
        if (key.startsWith("hubdigital-") && !keep.has(key)) await caches.delete(key);
      }
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Google Fonts: stale-while-revalidate across origins.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (BYPASS_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(event));
    return;
  }

  // Hashed build output never changes: cache first.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Other static files from /public (icons, images, svg, fonts).
  if (/\.(png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === "opaque") cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

// Pages are never stored: server-rendered HTML can hold a signed-in user's
// data, which must not outlive a sign-out on a shared device.
async function networkFirstPage(event) {
  try {
    return (await event.preloadResponse) || (await fetch(event.request));
  } catch {
    const offline = await caches.match(OFFLINE_URL);
    if (!offline) return Response.error();
    // Cloudflare serves /offline.html through a redirect to /offline, and a
    // redirected response is refused for a navigation: copy it into a fresh one.
    return new Response(await offline.blob(), {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
}
