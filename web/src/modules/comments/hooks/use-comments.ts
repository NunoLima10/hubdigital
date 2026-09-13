import { API } from "@/api/api";
import { ItemResponse, ListResponse } from "@/types";
import type { Comment, CommentBody } from "@hubdigital/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

type ApiError = AxiosError<{ error: { message: string } }>;

export function commentsQueryKey(slug: string) {
  return ["comments", slug] as const;
}

async function fetchComments(slug: string) {
  const response = await API.get<ListResponse<Comment>>(
    `/projects/${slug}/comments`
  );
  return response.data.data;
}

export function useComments(slug: string | undefined) {
  return useQuery({
    queryKey: commentsQueryKey(slug ?? ""),
    queryFn: () => fetchComments(slug as string),
    enabled: Boolean(slug),
  });
}

/**
 * Posting, editing and removing all invalidate the same thread, plus the
 * project listings so the comment count on the cards keeps up.
 */
function useRefreshThread(slug: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: commentsQueryKey(slug) });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["project", slug] });
  };
}

export function useCreateComment(slug: string) {
  const refresh = useRefreshThread(slug);

  const { mutate, isPending } = useMutation<
    ItemResponse<Comment>,
    ApiError,
    CommentBody
  >({
    mutationFn: async (payload) => {
      const response = await API.post<ItemResponse<Comment>>(
        `/projects/${slug}/comments`,
        payload
      );
      return response.data;
    },
    onSuccess: refresh,
    meta: { errorMessage: "Não foi possível publicar o comentário" },
  });

  return { createComment: mutate, isPending };
}

export function useUpdateComment(slug: string) {
  const refresh = useRefreshThread(slug);

  const { mutate, isPending } = useMutation<
    ItemResponse<Comment>,
    ApiError,
    { id: number; body: string }
  >({
    mutationFn: async ({ id, body }) => {
      const response = await API.patch<ItemResponse<Comment>>(
        `/comments/${id}`,
        { body }
      );
      return response.data;
    },
    onSuccess: refresh,
    meta: { errorMessage: "Não foi possível guardar a alteração" },
  });

  return { updateComment: mutate, isPending };
}

export function useDeleteComment(slug: string) {
  const refresh = useRefreshThread(slug);

  const { mutate, isPending } = useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      await API.delete(`/comments/${id}`);
    },
    onSuccess: refresh,
    meta: { errorMessage: "Não foi possível remover o comentário" },
  });

  return { deleteComment: mutate, isPending };
}
