import { API } from "@/api/api";
import type { ItemResponse } from "@/types";
import type { UnseenProjectBadge } from "@hubdigital/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const unseenProjectBadgesQueryKey = ["project-badges", "me", "unseen"] as const;

/** Achievements on the signed-in maker's projects they haven't been shown. */
export function useUnseenProjectBadges(enabled = true) {
  return useQuery({
    queryKey: unseenProjectBadgesQueryKey,
    queryFn: async () => {
      const response = await API.get<ItemResponse<UnseenProjectBadge[]>>(
        "/project-badges/me/unseen",
      );
      return response.data.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

/** Records that the celebration for these awards was shown. */
export function useMarkProjectBadgesSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await API.post<ItemResponse<UnseenProjectBadge[]>>(
        "/project-badges/me/seen",
        { ids },
      );
      return response.data.data;
    },
    onSuccess: (awards) => {
      queryClient.setQueryData(unseenProjectBadgesQueryKey, awards);
    },
  });
}
