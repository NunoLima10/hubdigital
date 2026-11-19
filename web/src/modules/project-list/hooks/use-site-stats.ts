import { API } from "@/api/api";
import type { SiteStats } from "@hubdigital/shared";
import { useQuery } from "@tanstack/react-query";

async function fetchSiteStats() {
  const response = await API.get<{ data: SiteStats | null }>("/site-stats");
  return response.data.data;
}

/** Site-wide numbers from PostHog; null when the API has none to give. */
export function useSiteStats() {
  return useQuery({
    queryKey: ["site-stats"],
    queryFn: fetchSiteStats,
    // The API refreshes PostHog at most every five minutes. Polling our cheap,
    // cached endpoint lets the browser pick up the completed background refresh
    // on the following minute without issuing extra PostHog queries.
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
