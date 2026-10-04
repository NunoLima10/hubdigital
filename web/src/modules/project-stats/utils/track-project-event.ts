import { env } from "@/app/env";
import type { ProjectEventType } from "@hubdigital/shared";

const STORAGE_PREFIX = "hd:evt";

/**
 * Whether this browser session has already reported this event. Counting once
 * per session is what makes a refresh, or a click on "Visitar site" three
 * times, a single visitor rather than three.
 *
 * Storage can throw (private mode, blocked site data). An unavailable store
 * means "not seen", so the event is still sent rather than dropped.
 */
function alreadyReported(key: string) {
  try {
    return window.sessionStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

function markReported(key: string) {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Nothing to do: the worst case is one duplicate count.
  }
}

/**
 * Fire-and-forget: reports that someone viewed or visited a project. Never
 * throws and never blocks the caller, because a failed counter must not break
 * the page it is counting.
 *
 * `keepalive` lets the request finish after the tab navigates away, which is
 * exactly the situation for a click through to the project's own site.
 */
export function trackProjectEvent(projectId: number, type: ProjectEventType) {
  // Also guards SSR: this module is imported by components that render on the
  // server, but only ever called from effects and click handlers.
  if (typeof window === "undefined") return;

  const key = `${STORAGE_PREFIX}:${type}:${projectId}`;
  if (alreadyReported(key)) return;
  markReported(key);

  void fetch(`${env.API_URL}/projects/${projectId}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // The cookie lets the API recognise the owner and skip their own visits.
    credentials: "include",
    keepalive: true,
    body: JSON.stringify({ type, source: "web" }),
  }).catch(() => {});
}
