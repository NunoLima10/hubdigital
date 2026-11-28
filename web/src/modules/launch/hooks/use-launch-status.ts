import { API } from "@/api/api";
import type { LaunchStatus } from "@hubdigital/shared";
import { queryOptions, useQuery } from "@tanstack/react-query";

const OPEN = (): LaunchStatus => ({
  locked: false,
  launchAt: null,
  bypass: false,
  now: new Date().toISOString(),
});

/**
 * The pre-launch lock, from the API (GET /v1/launch-status), which reads the
 * PostHog `launch-gate` flag. It goes through the API rather than the PostHog
 * SDK so an ad blocker can't skip it, and so the server render already knows.
 *
 * If the API can't answer, the site renders as usual: the API refuses the
 * real requests on its own while locked, so failing open here costs nothing.
 */
export const launchStatusQueryOptions = () =>
  queryOptions({
    queryKey: ["launch-status"],
    queryFn: async () => {
      try {
        const response = await API.get<{ data: LaunchStatus }>("/launch-status");
        return response.data.data;
      } catch {
        return OPEN();
      }
    },
    staleTime: 30_000,
  });

export function useLaunchStatus() {
  return useQuery({
    ...launchStatusQueryOptions(),
    // The server render has no session, so staff only learn they may pass
    // once the browser asks with its cookie.
    refetchOnMount: "always",
    // While closed, check now and then so the page opens by itself.
    refetchInterval: (query) => (query.state.data?.locked ? 30_000 : false),
  });
}
