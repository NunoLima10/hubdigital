import { API } from "@/api/api";
import type { PublicSettings } from "@hubdigital/shared";
import { useQuery } from "@tanstack/react-query";

async function fetchPublicSettings() {
  const response = await API.get<{ data: PublicSettings }>("/settings/public");
  return response.data.data;
}

/**
 * The two flags the public site reads: the announcement banner and whether
 * submissions are open. Cached for a few minutes — they change a handful of
 * times a year and every page would otherwise refetch them.
 */
export function usePublicSettings() {
  return useQuery({
    queryKey: ["settings", "public"],
    queryFn: fetchPublicSettings,
    staleTime: 5 * 60 * 1000,
  });
}
