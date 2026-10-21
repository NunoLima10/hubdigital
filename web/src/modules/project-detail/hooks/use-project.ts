import { authClient } from "@/lib/auth-client";
import { API } from "@/api/api";
import { Project } from "@/modules/submit/types/project";
import { ItemResponse } from "@/types";
import { queryOptions, useQuery } from "@tanstack/react-query";

async function fetchProject(slug: string) {
  const response = await API.get<ItemResponse<Project>>(`/projects/${slug}`);
  return response.data.data;
}

export function projectQueryOptions(slug: string | undefined, viewerId?: string | null) {
  return queryOptions({
    queryKey: ["project", slug, viewerId === undefined ? "loader" : viewerId],
    queryFn: () => fetchProject(slug as string),
    enabled: Boolean(slug),
    staleTime: 30 * 1000,
  });
}

export function useProject(slug: string | undefined) {
  const { data: session } = authClient.useSession();
  return useQuery(projectQueryOptions(slug, session?.user.id ?? null));
}
