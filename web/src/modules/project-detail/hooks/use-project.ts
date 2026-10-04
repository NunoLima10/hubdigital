import { API } from "@/api/api";
import { Project } from "@/modules/submit/types/project";
import { ItemResponse } from "@/types";
import { queryOptions, useQuery } from "@tanstack/react-query";

async function fetchProject(slug: string) {
  const response = await API.get<ItemResponse<Project>>(`/projects/${slug}`);
  return response.data.data;
}

export function projectQueryOptions(slug: string | undefined) {
  return queryOptions({
    queryKey: ["project", slug],
    queryFn: () => fetchProject(slug as string),
    enabled: Boolean(slug),
    staleTime: 30 * 1000,
  });
}

export function useProject(slug: string | undefined) {
  return useQuery(projectQueryOptions(slug));
}
