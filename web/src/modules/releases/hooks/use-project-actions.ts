import { API } from "@/api/api";
import { CreateOptions, ItemResponse } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";

type PublishResponse = { id: number; slug: string; status: string };

type ApiError = AxiosError<{ error: { message: string } }>;

/** Both actions change what the public listings show, not just the dashboard. */
function useRefreshProjectLists() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["my-projects"] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["project-map"] });
    queryClient.invalidateQueries({ queryKey: ["project"] });
  };
}

async function publishProject(projectId: number) {
  const response = await API.post<ItemResponse<PublishResponse>>(
    `/projects/${projectId}/publish`
  );
  return response.data;
}

export function usePublishProject(options?: CreateOptions) {
  const refresh = useRefreshProjectLists();

  const { mutate, isPending, variables } = useMutation<
    ItemResponse<PublishResponse>,
    ApiError,
    number
  >({
    mutationFn: publishProject,
    onSuccess: (response) => {
      refresh();
      toast.success(options?.successMessage ?? (response.data.status === "pending"
        ? "Projeto enviado para revisão. Ainda não está público."
        : "Projeto publicado. Já está no ar!"));
      options?.onSuccess?.();
    },
    onError: options?.onError,
    meta: {
      errorMessage:
        options?.errorMessage ?? "Não foi possível publicar o projeto",
    },
  });

  return {
    publishProject: mutate,
    isPending,
    pendingProjectId: isPending ? variables : undefined,
  };
}

async function deleteProject(projectId: number) {
  await API.delete(`/projects/${projectId}`);
}

export function useDeleteProject(options?: CreateOptions) {
  const refresh = useRefreshProjectLists();

  const { mutate, isPending, variables } = useMutation<void, ApiError, number>({
    mutationFn: deleteProject,
    onSuccess: () => {
      refresh();
      options?.onSuccess?.();
    },
    onError: options?.onError,
    meta: {
      successMessage: options?.successMessage ?? "Projeto removido",
      errorMessage:
        options?.errorMessage ?? "Não foi possível remover o projeto",
    },
  });

  return {
    deleteProject: mutate,
    isPending,
    pendingProjectId: isPending ? variables : undefined,
  };
}
