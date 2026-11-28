import { LaunchCountdown } from "@/modules/launch/components/launch-countdown/launch-countdown";
import { useLaunchStatus } from "@/modules/launch/hooks/use-launch-status";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Pages that stay reachable while the site is locked: the legal pages the
 * cookie banner links to.
 */
const OPEN_WHILE_LOCKED = ["/privacidade", "/termos"];

/**
 * Shows the countdown page instead of the site while the PostHog `launch-gate`
 * flag is on. This only hides the site; the API refuses the requests itself
 * (api/src/plugins/launch-gate.ts). Staff, signed in through the admin app,
 * get `bypass` and see the real site.
 */
export function LaunchGate({ children }: { children: ReactNode }) {
  const { data } = useLaunchStatus();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const closed =
    data?.locked && !data.bypass && !OPEN_WHILE_LOCKED.includes(pathname.replace(/\/+$/, ""));
  if (!closed) return children;

  return (
    <LaunchCountdown
      launchAt={data.launchAt ? new Date(data.launchAt) : null}
      initialNow={Date.parse(data.now)}
    />
  );
}
