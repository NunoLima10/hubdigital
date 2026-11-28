import { privatePageHead } from "@/lib/seo";
import { LaunchCountdown } from "@/modules/launch/components/launch-countdown/launch-countdown";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// ?at=2026-12-05T18:00 picks the launch; ?at=none shows "Em breve";
// without it, a sample date.
const searchSchema = z.object({ at: z.string().optional() });

export const Route = createFileRoute("/playground/launch")({
  head: () => privatePageHead("Playground do lançamento"),
  validateSearch: searchSchema,
  component: LaunchPlayground,
});

/**
 * The pre-launch countdown page on its own. On the real site the date comes
 * from the PostHog `launch-gate` flag (LaunchGate); here it is a search param
 * so the page can be looked at any distance from launch.
 */
function LaunchPlayground() {
  const { at } = Route.useSearch();
  if (at === "none") return <LaunchCountdown launchAt={null} />;
  const parsed = at ? new Date(at) : null;
  const launchAt =
    parsed && !Number.isNaN(parsed.getTime())
      ? parsed
      : new Date(Date.UTC(2026, 11, 5, 19, 0)); // 5 Dec, 18:00 in Cabo Verde
  return <LaunchCountdown launchAt={launchAt} />;
}
