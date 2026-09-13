import { API } from "@/api/api";
import { authClient } from "@/lib/auth-client";
import { ProjectMinimal } from "@/modules/submit/types/project";
import type { Island, ListPeriod, ListSort } from "@hubdigital/shared";
import { useQuery } from "@tanstack/react-query";

export type ProjectsMeta = {
  limit: number;
  offset: number;
  total: number;
  /** ISO week the listing covers, or null when it spans every week. */
  week: string | null;
};

export type ProjectsResponse = {
  data: ProjectMinimal[];
  meta: ProjectsMeta;
};

export type ProjectsQuery = {
  period?: ListPeriod;
  sort?: ListSort;
  limit?: number;
  /** A specific ISO week (`2026-W35`); takes precedence over `period`. */
  week?: string;
  q?: string;
  island?: Island;
  categoryId?: number;
  pricing?: "free" | "freemium" | "paid";
};

type ProjectsQueryKeyInput = ProjectsQuery & { userId?: string | null };

/**
 * Shared so optimistic upvote updates can find the exact cached listing.
 *
 * The viewer's id is part of the key because `hasUpvoted` is per-user: without
 * it, a listing fetched while logged out would be reused after signing in and
 * report that the new user has voted for nothing.
 */
export function projectsQueryKey({
  period = "this_week",
  sort = "upvotes",
  limit = 50,
  week,
  userId = null,
  q,
  island,
  categoryId,
  pricing,
}: ProjectsQueryKeyInput = {}) {
  return [
    "projects",
    {
      period,
      sort,
      limit,
      week: week ?? null,
      userId,
      q: q ?? null,
      island: island ?? null,
      categoryId: categoryId ?? null,
      pricing: pricing ?? null,
    },
  ] as const;
}

async function fetchProjects(query: ProjectsQuery) {
  const limit = query.limit ?? 50;

  // An archived week has its own endpoint: it is always ranked by votes and is
  // addressed by week id rather than by a relative period.
  if (query.week) {
    const response = await API.get<ProjectsResponse>("/projects/leaderboard", {
      params: { limit, week: query.week },
    });

    return response.data;
  }

  const response = await API.get<ProjectsResponse>("/projects", {
    params: {
      limit,
      period: query.period ?? "this_week",
      sort: query.sort ?? "upvotes",
      // Axios omits undefined params, so unset filters simply do not appear.
      q: query.q,
      island: query.island,
      categoryId: query.categoryId,
      pricing: query.pricing,
    },
  });

  return response.data;
}

export function useProjects(query: ProjectsQuery = {}) {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id ?? null;

  return useQuery({
    queryKey: projectsQueryKey({ ...query, userId }),
    queryFn: () => fetchProjects(query),
  });
}
