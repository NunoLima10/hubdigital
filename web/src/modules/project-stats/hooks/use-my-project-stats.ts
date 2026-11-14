import { API } from "@/api/api";
import { ItemResponse } from "@/types";
import type { MyProjectStats, StatsRange } from "@hubdigital/shared";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

async function fetchMyProjectStats(range: StatsRange) {
  const response = await API.get<ItemResponse<MyProjectStats>>(
    "/projects/mine/stats",
    { params: { range } }
  );
  return response.data.data;
}

export function useMyProjectStats(range: StatsRange) {
  return useQuery({
    queryKey: ["my-project-stats", range],
    queryFn: () => fetchMyProjectStats(range),
    // Switching range keeps the old chart on screen until the new one lands,
    // instead of flashing back to a skeleton.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
