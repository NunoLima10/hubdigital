import { API } from "@/api/api";
import type { ItemResponse } from "@/types";
import type { ProjectStats, StatsRange } from "@hubdigital/shared";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

async function fetchProjectStats(projectId: number, range: StatsRange) {
  const response = await API.get<ItemResponse<ProjectStats>>(
    `/projects/${projectId}/stats`,
    { params: { range } },
  );

  return response.data.data;
}

export function useProjectStats(
  projectId: number | undefined,
  range: StatsRange,
) {
  return useQuery({
    queryKey: ["project-stats", projectId, range],
    queryFn: () => fetchProjectStats(projectId as number, range),
    enabled: projectId !== undefined,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
