import { authClient } from "@/lib/auth-client";
import { API } from "@/api/api";
import { Project } from "@/modules/submit/types/project";
import { ItemResponse } from "@/types";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  return useQuery({
    ...projectQueryOptions(slug, session?.user.id ?? null),
    // The loader's anonymous copy stands in until the viewer's own arrives. The
    // server renders from it, so the HTML crawlers get holds the project rather
    // than a skeleton, and the browser's first paint matches it.
    placeholderData: () => queryClient.getQueryData(projectQueryOptions(slug).queryKey),
  });
}
