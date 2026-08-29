import { API } from "@/api/api";
import { ProjectMinimal } from "@/modules/submit/types/project";
import { ItemResponse, ListResponse } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type ToggleUpvoteResponse = { upvoted: boolean; upvoteCount: number };

async function toggleUpvote(projectId: number) {
  const response = await API.post<ItemResponse<ToggleUpvoteResponse>>(
    `/projects/${projectId}/upvote`
  );
  return response.data.data;
}

function patchProject(project: ProjectMinimal): ProjectMinimal {
  return {
    ...project,
    hasUpvoted: !project.hasUpvoted,
    upvoteCount: project.hasUpvoted
      ? project.upvoteCount - 1
      : project.upvoteCount + 1,
  };
}

export function useToggleUpvote() {
  const queryClient = useQueryClient();

  const { mutate, isPending, variables } = useMutation({
    mutationFn: toggleUpvote,
    onMutate: async (projectId: number) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });

      const previous = queryClient.getQueryData<ListResponse<ProjectMinimal>>(
        ["projects"]
      );

      queryClient.setQueryData<ListResponse<ProjectMinimal>>(
        ["projects"],
        (current) =>
          current && {
            ...current,
            data: current.data.map((project) =>
              project.id === projectId ? patchProject(project) : project
            ),
          }
      );

      return { previous };
    },
    onError: (_error, _projectId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["projects"], context.previous);
      }
    },
    meta: {
      errorMessage: "Erro ao votar no projeto",
    },
  });

  return {
    toggleUpvote: mutate,
    isPending,
    pendingProjectId: isPending ? variables : undefined,
  };
}
