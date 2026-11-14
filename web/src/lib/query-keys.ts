import type { QueryClient } from "@tanstack/react-query";

/**
 * Stable cache roots shared by queries and mutations.
 *
 * Invalidation rules:
 * - project create/update/publish/delete: listings, map, dashboard and detail;
 * - comment create/update/delete: thread, listing comment counts and detail;
 * - votes: optimistic listing update followed by detail refresh;
 * - announcements/makers: invalidate their domain root so every viewer copy refreshes.
 */
export const queryKeys = {
  projects: ["projects"] as const,
  projectDetails: ["project"] as const,
  projectDetail: (slug: string) => ["project", slug] as const,
  projectMap: ["project-map"] as const,
  myProjects: ["my-projects"] as const,
  comments: ["comments"] as const,
  commentThread: (slug: string) => ["comments", slug] as const,
  announcements: ["announcements"] as const,
  myAnnouncements: (projectId: number) => ["my-announcements", projectId] as const,
  projectMembers: (projectId?: number) =>
    projectId === undefined
      ? (["project-members"] as const)
      : (["project-members", projectId] as const),
  invitations: {
    all: ["invitations"] as const,
    received: ["invitations", "received"] as const,
    sent: ["invitations", "sent"] as const,
  },
  makers: ["maker"] as const,
  destinationMetrics: (projectId: number) => ["destination-metrics", projectId] as const,
};

export function invalidateProjectCollections(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
    queryClient.invalidateQueries({ queryKey: queryKeys.projectMap }),
    queryClient.invalidateQueries({ queryKey: queryKeys.myProjects }),
  ]);
}

export function invalidateProjectCaches(
  queryClient: QueryClient,
  options: { slug?: string; projectId?: number } = {},
) {
  const detailKey = options.slug
    ? queryKeys.projectDetail(options.slug)
    : queryKeys.projectDetails;

  return Promise.all([
    invalidateProjectCollections(queryClient),
    queryClient.invalidateQueries({ queryKey: detailKey }),
    ...(options.projectId
      ? [
          queryClient.invalidateQueries({
            queryKey: queryKeys.destinationMetrics(options.projectId),
          }),
        ]
      : []),
  ]);
}

export function invalidateCommentCaches(queryClient: QueryClient, slug: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.commentThread(slug) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
    queryClient.invalidateQueries({ queryKey: queryKeys.projectDetail(slug) }),
  ]);
}
