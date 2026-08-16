import { API } from "@/api/api";
import { CreateOptions, ItemResponse } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { CreateProjectPayload } from "./use-create-project";

type UpdateProjectResponse = { id: number; slug: string };

type UpdateProjectVariables = {
  id: number;
  payload: Partial<CreateProjectPayload>;
};

async function patchProject({ id, payload }: UpdateProjectVariables) {
  const response = await API.patch<ItemResponse<UpdateProjectResponse>>(
    `/projects/${id}`,
    payload
  );
  return response.data;
}

export function useUpdateProject(options?: CreateOptions) {
  const { mutate, isPending } = useMutation<
    ItemResponse<UpdateProjectResponse>,
    AxiosError<{ error: { message: string } }>,
    UpdateProjectVariables
  >({
    mutationFn: patchProject,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
    meta: {
      errorMessage: options?.errorMessage ?? "Erro ao atualizar o projeto",
      successMessage:
        options?.successMessage ?? "Projeto atualizado com sucesso!",
      invalidatesQuery: ["my-projects"],
    },
  });

  return { updateProject: mutate, isPending };
}
