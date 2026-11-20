import { env } from "@/app/env";
import {
  readAnalyticsConsent,
  writeAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics-consent";
import type { PostHog, Properties } from "posthog-js";

/**
 * Product analytics (PostHog), browser only. It records what people do on the
 * site — pages, funnels, clicks — never who they are: people are identified
 * by their account id alone, with no name or email.
 *
 * Consent: until the visitor accepts the cookie banner, and after they
 * refuse, PostHog runs in cookieless mode — nothing is stored in the browser
 * and PostHog's servers derive a privacy-preserving daily hash instead. Only
 * "granted" lets it use cookies/localStorage (see analytics-consent.ts).
 *
 * With VITE_APP_POSTHOG_KEY unset every call here is a no-op, so local
 * development and forks send nothing. The SDK is imported on first use, which
 * keeps it out of the server render and the initial bundle.
 *
 * Business facts the API already knows (a project published, a comment
 * posted, an upvote) are captured by the API (api/src/lib/analytics.ts), which
 * ad blockers cannot drop. Capture here only what happens in the browser.
 */

export const analyticsEnabled = Boolean(env.POSTHOG_KEY);
const analyticsContext = { app: "web", environment: import.meta.env.MODE };

let loading: Promise<PostHog | null> | null = null;

/** Puts PostHog in the mode the stored choice asks for. */
function applyConsent(posthog: PostHog, consent: AnalyticsConsent | null) {
  if (consent === "granted") {
    if (!posthog.has_opted_in_capturing()) {
      posthog.opt_in_capturing({ captureEventName: false });
    }
  } else if (!posthog.has_opted_out_capturing()) {
    // Opted out + cookieless_mode "on_reject" = cookieless capture.
    posthog.opt_out_capturing();
  }
}

function load(): Promise<PostHog | null> {
  if (typeof window === "undefined" || !analyticsEnabled) {
    return Promise.resolve(null);
  }

  loading ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(env.POSTHOG_KEY, {
        api_host: env.POSTHOG_HOST,
        ui_host: env.POSTHOG_UI_HOST,
        defaults: "2026-08-30",
        // No cookies or localStorage until the visitor accepts; refusing
        // keeps it cookieless instead of switching analytics off.
        cookieless_mode: "on_reject",
        opt_out_capturing_by_default: true,
        // Client-side navigations are pageviews too, not only full loads.
        capture_pageview: "history_change",
        capture_pageleave: true,
        // init can queue the first automatic pageview before register() below.
        // Add the query-critical context at send time so that first view is
        // included in the public statistics too.
        before_send: (event) => ({
          ...event,
          properties: { ...event.properties, ...analyticsContext },
        }),
        // Anonymous visitors stay anonymous events; a person profile exists
        // only once someone signs in and is identified by account id.
        person_profiles: "identified_only",
      });
      applyConsent(posthog, readAnalyticsConsent());
      posthog.register(analyticsContext);
      return posthog;
    })
    .catch(() => null);

  return loading;
}

/** Starts PostHog. Safe to call more than once. */
export function initAnalytics() {
  void load();
}

/** Saves the visitor's answer to the cookie banner and applies it. */
export function setAnalyticsConsent(consent: AnalyticsConsent) {
  writeAnalyticsConsent(consent);
  void load().then((posthog) => {
    if (!posthog) return;
    applyConsent(posthog, consent);
    posthog.capture("analytics_consent_updated", { consent });
  });
}

/** Records a browser-only event, e.g. a funnel step or a CTA click. */
export function track(event: string, properties?: Properties) {
  void load().then((posthog) => posthog?.capture(event, properties));
}

/**
 * Links this browser's events to an account. Only the account id and
 * non-personal traits (role, onboarded) — never a name or email.
 */
export function identifyUser(userId: string, traits?: Properties) {
  void load().then((posthog) => {
    if (!posthog) return;
    if (posthog.get_distinct_id() !== userId) posthog.identify(userId, traits);
    else if (traits) posthog.setPersonProperties(traits);
  });
}

/** Forgets the account on sign-out, so the next visitor starts fresh. */
export function resetUser() {
  void load().then((posthog) => {
    if (!posthog) return;
    // reset() also clears PostHog's consent record: re-apply ours after it.
    posthog.reset();
    applyConsent(posthog, readAnalyticsConsent());
  });
}
