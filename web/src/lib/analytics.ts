import { env } from "@/app/env";

/**
 * The Umami tracking script for the root head(), or nothing when
 * VITE_APP_UMAMI_WEBSITE_ID is unset. Umami sets no cookies, so it needs no
 * consent banner. Per-project numbers are counted by the API, not here.
 */
export function analyticsScripts() {
  if (!env.UMAMI_WEBSITE_ID) return [];
  return [
    {
      src: env.UMAMI_SCRIPT_URL,
      defer: true,
      "data-website-id": env.UMAMI_WEBSITE_ID,
    },
  ];
}
