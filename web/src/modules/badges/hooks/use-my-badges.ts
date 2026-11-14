import { API } from "@/api/api";
import type { ItemResponse } from "@/types";
import type { BadgeKey, MyBadge } from "@hubdigital/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const myBadgesQueryKey = ["badges", "me"] as const;

export function useMyBadges(enabled = true) {
  return useQuery({
    queryKey: myBadgesQueryKey,
    queryFn: async () => {
      const response = await API.get<ItemResponse<MyBadge[]>>("/badges/me");
      return response.data.data;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

/** Chooses the badge shown on the profile and in comments; null hides it. */
export function useFeatureBadge() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (key: BadgeKey | null) => {
      const response = await API.put<ItemResponse<MyBadge[]>>(
        "/badges/me/featured",
        { key },
      );
      return response.data.data;
    },
    onSuccess: (badges) => {
      queryClient.setQueryData(myBadgesQueryKey, badges);
      // The public profile and comment threads carry the featured badge.
      void queryClient.invalidateQueries({ queryKey: ["maker"] });
      void queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
    meta: {
      successMessage: "Distintivo atualizado",
      errorMessage: "Não foi possível atualizar o distintivo",
    },
  });

  return { featureBadge: mutation.mutate, isPending: mutation.isPending };
}

/** Records that the "you earned a badge" moment was shown. */
export function useMarkBadgesSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keys: BadgeKey[]) => {
      const response = await API.post<ItemResponse<MyBadge[]>>(
        "/badges/me/seen",
        { keys },
      );
      return response.data.data;
    },
    onSuccess: (badges) => {
      queryClient.setQueryData(myBadgesQueryKey, badges);
    },
  });
}
