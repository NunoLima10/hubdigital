import { API } from "@/api/api";
import type { ProjectMinimal } from "@/modules/submit/types/project";
import type { ItemResponse, ListResponse } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const favoritesQueryKey = ["projects", "favorites"] as const;

async function fetchFavorites() {
  const response = await API.get<ListResponse<ProjectMinimal>>(
    "/projects/favorites",
    { params: { limit: 100 } },
  );
  return response.data;
}

export function useFavorites(enabled = true) {
  return useQuery({
    queryKey: favoritesQueryKey,
    queryFn: fetchFavorites,
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (projectId: number) => {
      const response = await API.post<ItemResponse<{ favorited: boolean }>>(
        `/projects/${projectId}/favorite`,
      );
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: favoritesQueryKey });
    },
    meta: {
      successMessage: "Favoritos atualizados",
      errorMessage: "Não foi possível atualizar os favoritos",
    },
  });

  return {
    toggleFavorite: mutation.mutate,
    pendingProjectId: mutation.isPending ? mutation.variables : undefined,
  };
}
