import { env } from "@/app/env";

type Sentry = typeof import("@sentry/react");

let sentry: Promise<Sentry | null> | undefined;

/**
 * Starts error reporting in the browser when VITE_APP_SENTRY_DSN is set. The
 * SDK is loaded on demand, so a deploy without a DSN ships none of it.
 */
export function initMonitoring() {
  if (typeof window === "undefined" || !env.SENTRY_DSN) return;
  sentry ??= import("@sentry/react")
    .then((Sentry) => {
      Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0,
      });
      return Sentry;
    })
    .catch(() => null);
}

/** Reports an error caught by a boundary; a no-op without a DSN. */
export function reportError(error: unknown) {
  initMonitoring();
  void sentry?.then((Sentry) => Sentry?.captureException(error));
}
