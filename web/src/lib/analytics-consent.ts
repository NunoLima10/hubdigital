import { useSyncExternalStore } from "react";

/**
 * The visitor's choice on analytics cookies, kept by us rather than by
 * PostHog: posthog.reset() (on sign-out) wipes PostHog's own consent record,
 * and the choice must outlive that. Remembering it is strictly necessary
 * storage, so it needs no consent of its own.
 *
 * - "granted": PostHog may use cookies/localStorage.
 * - "denied": PostHog runs in cookieless mode (nothing stored in the browser).
 * - null: not chosen yet. Treated as "denied" until the visitor answers.
 */
export type AnalyticsConsent = "granted" | "denied";

const STORAGE_KEY = "hubdigital-analytics-consent";
const CHANGE_EVENT = "hubdigital:analytics-consent";

export function readAnalyticsConsent(): AnalyticsConsent | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function writeAnalyticsConsent(value: AnalyticsConsent | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * The current choice. "unknown" during the server render and hydration, so
 * the banner never flashes for someone who already answered.
 */
export function useAnalyticsConsent(): AnalyticsConsent | null | "unknown" {
  return useSyncExternalStore(subscribe, readAnalyticsConsent, () => "unknown");
}
