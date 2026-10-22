import * as Sentry from "@sentry/node";
import { config } from "./config";

// Imported first by main.ts: Sentry has to be initialised before the modules
// it instruments are loaded. Without SENTRY_DSN this does nothing.
if (config.SENTRY_DSN) {
  Sentry.init({
    dsn: config.SENTRY_DSN,
    environment: config.NODE_ENV,
    // Errors only. Performance tracing can be turned on once there is traffic
    // worth sampling.
    tracesSampleRate: 0,
  });
}
