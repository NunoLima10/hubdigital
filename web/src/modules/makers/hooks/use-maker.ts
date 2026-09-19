import { API } from "@/api/api";
import { CreateOptions, ItemResponse } from "@/types";
import type { MakerProfile, MakerProfileUpdate } from "@hubdigital/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

type ApiError = AxiosError<{ error: { message: string } }>;

async function fetchMaker(handle: string) {
  const response = await API.get<ItemResponse<MakerProfile>>(
    `/makers/${handle}`
  );
  return response.data.data;
}

export function useMaker(handle: string | undefined) {
  return useQuery({
    queryKey: ["maker", handle],
    queryFn: () => fetchMaker(handle as string),
    enabled: Boolean(handle),
  });
}

/** The signed-in maker's own handle, used to link to their public profile. */
export function useMyHandle() {
  return useQuery({
    queryKey: ["maker", "me"],
    queryFn: async () => {
      const response = await API.get<ItemResponse<{ handle: string | null }>>(
        "/makers/me"
      );
      return response.data.data.handle;
    },
  });
}

type UpdateResult = ItemResponse<{ handle: string | null }>;

export function useUpdateMaker(options?: CreateOptions<UpdateResult>) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<
    UpdateResult,
    ApiError,
    MakerProfileUpdate
  >({
    mutationFn: async (payload) => {
      const response = await API.patch<UpdateResult>("/makers/me", payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["maker"] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
    meta: {
      successMessage: options?.successMessage ?? "Perfil atualizado",
      // The API answers 409 with a readable message when the handle is taken,
      // so surface that instead of a generic failure.
      errorMessage: options?.errorMessage ?? "Não foi possível guardar o perfil",
    },
  });

  return { updateMaker: mutate, isPending };
}
