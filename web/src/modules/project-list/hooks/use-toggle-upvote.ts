import { API } from "@/api/api";
import { ProjectMinimal } from "@/modules/submit/types/project";
import { ItemResponse } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectsResponse } from "./use-projects";

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

      // The same project can sit in several cached listings at once (this week,
      // last week, an archived leaderboard), so patch every one of them.
      const previous = queryClient.getQueriesData<ProjectsResponse>({
        queryKey: ["projects"],
      });

      queryClient.setQueriesData<ProjectsResponse>(
        { queryKey: ["projects"] },
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
      context?.previous.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    // The optimistic guess is derived from whatever the cache held; the response
    // is authoritative, so write the real numbers back over it.
    onSuccess: (result, projectId) => {
      queryClient.setQueriesData<ProjectsResponse>(
        { queryKey: ["projects"] },
        (current) =>
          current && {
            ...current,
            data: current.data.map((project) =>
              project.id === projectId
                ? {
                    ...project,
                    hasUpvoted: result.upvoted,
                    upvoteCount: result.upvoteCount,
                  }
                : project
            ),
          }
      );
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
