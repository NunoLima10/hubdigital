import { API } from "@/api/api";
import type { ItemResponse } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OnboardingResponse } from "./use-create-onboarding";

export type MakerPreferences = Omit<OnboardingResponse, "bio">;

export function usePreferences() {
  return useQuery({
    queryKey: ["maker", "preferences"],
    queryFn: async () => {
      const response = await API.get<ItemResponse<MakerPreferences>>(
        "/makers/me/preferences",
      );
      return response.data.data;
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (preferences: MakerPreferences) => {
      const response = await API.patch<ItemResponse<MakerPreferences>>(
        "/makers/me/preferences",
        preferences,
      );
      return response.data.data;
    },
    onSuccess: (preferences) => {
      queryClient.setQueryData(["maker", "preferences"], preferences);
    },
    meta: {
      successMessage: "Preferências guardadas",
      errorMessage: "Não foi possível guardar as preferências",
    },
  });

  return { updatePreferences: mutation.mutate, isPending: mutation.isPending };
}
