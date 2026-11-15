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
    // The numbers change once a day (API snapshots); refetching often gains nothing.
    staleTime: 30 * 60 * 1000,
  });
}
