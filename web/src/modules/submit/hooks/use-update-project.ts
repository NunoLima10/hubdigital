import { toast } from "sonner";
import { API } from "@/api/api";
import { CreateOptions, ItemResponse } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { CreateProjectPayload } from "./use-create-project";
import { invalidateProjectCaches, queryKeys } from "@/lib/query-keys";

type UpdateProjectResponse = { id: number; slug: string; pendingReview?: boolean };

type UpdateProjectVariables = {
  id: number;
  payload: Partial<CreateProjectPayload>;
};

async function patchProject({ id, payload }: UpdateProjectVariables) {
  const response = await API.patch<ItemResponse<UpdateProjectResponse>>(`/projects/${id}`, payload);
  return response.data;
}

export function useUpdateProject(options?: CreateOptions<ItemResponse<UpdateProjectResponse>>) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation<
    ItemResponse<UpdateProjectResponse>,
    AxiosError<{ error: { message: string } }>,
    UpdateProjectVariables
  >({
    mutationFn: patchProject,
    onSuccess: (response) => {
      void invalidateProjectCaches(queryClient, {
        slug: response.data.slug,
        projectId: response.data.id,
      });
      toast.success(
        response.data.pendingReview
          ? "Alterações enviadas para revisão. A página atual continua pública."
          : "Projeto atualizado.",
      );
      options?.onSuccess?.(response);
    },
    onError: options?.onError,
    meta: {
      errorMessage: options?.errorMessage ?? "Erro ao atualizar o projeto",

      invalidatesQuery: queryKeys.myProjects,
    },
  });

  return { updateProject: mutate, isPending };
}
