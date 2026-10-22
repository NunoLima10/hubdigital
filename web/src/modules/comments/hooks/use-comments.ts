import { API } from "@/api/api";
import { authClient } from "@/lib/auth-client";
import { ItemResponse, ListResponse } from "@/types";
import type { Comment, CommentBody } from "@hubdigital/shared";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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

/**
 * `isOwn` depends on who is asking, so the viewer is part of the key, like the
 * project query. The loader fetches anonymously under "loader".
 */
export function commentsQueryOptions(slug: string | undefined, viewerId?: string | null) {
  return queryOptions({
    queryKey: [...commentsQueryKey(slug ?? ""), viewerId === undefined ? "loader" : viewerId],
    queryFn: () => fetchComments(slug as string),
    enabled: Boolean(slug),
    staleTime: 30 * 1000,
  });
}

export function useComments(slug: string | undefined) {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  return useQuery({
    ...commentsQueryOptions(slug, session?.user.id ?? null),
    // Server-rendered thread until the viewer's own copy, with their edit and
    // remove actions, arrives.
    placeholderData: () => queryClient.getQueryData(commentsQueryOptions(slug).queryKey),
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
