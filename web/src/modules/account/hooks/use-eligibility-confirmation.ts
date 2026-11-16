import { API } from "@/api/api";
import type { ItemResponse } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type EligibilityConfirmation = {
  confirmedAt: string | null;
};

const eligibilityConfirmationQueryKey = ["account", "eligibility-confirmation"] as const;

export function useEligibilityConfirmation() {
  return useQuery({
    queryKey: eligibilityConfirmationQueryKey,
    queryFn: async () => {
      const response = await API.get<ItemResponse<EligibilityConfirmation>>(
        "/users/me/eligibility-confirmation",
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useConfirmEligibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await API.put<ItemResponse<EligibilityConfirmation>>(
        "/users/me/eligibility-confirmation",
        { confirmed: true },
      );
      return response.data.data;
    },
    onSuccess: (confirmation) => {
      queryClient.setQueryData(eligibilityConfirmationQueryKey, confirmation);
    },
    meta: {
      successMessage: "Confirmação guardada",
      errorMessage: "Não foi possível guardar a confirmação",
    },
  });
}
