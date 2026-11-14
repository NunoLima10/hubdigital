import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReceivedInvitation, SentInvitation } from "@hubdigital/shared";
import { API } from "@/api/api";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";

export function useReceivedInvitations() {
  const { data: session } = authClient.useSession();
  return useQuery({
    queryKey: [...queryKeys.invitations.received, session?.user.id ?? null],
    enabled: Boolean(session),
    queryFn: async ({ signal }) =>
      (
        await API.get<{ data: ReceivedInvitation[] }>("/invitations", {
          signal,
        })
      ).data.data,
  });
}

export function useSentInvitations() {
  const { data: session } = authClient.useSession();
  return useQuery({
    queryKey: [...queryKeys.invitations.sent, session?.user.id ?? null],
    enabled: Boolean(session),
    queryFn: async ({ signal }) =>
      (
        await API.get<{ data: SentInvitation[] }>("/invitations/sent", {
          signal,
        })
      ).data.data,
  });
}

/** Refreshes every view that shows a team or an invitation. */
export function useInvalidateTeams() {
  const cache = useQueryClient();
  return () =>
    Promise.all([
      cache.invalidateQueries({ queryKey: queryKeys.invitations.all }),
      cache.invalidateQueries({ queryKey: queryKeys.projectMembers() }),
      cache.invalidateQueries({ queryKey: queryKeys.makers }),
    ]);
}

export function useReplyToInvitation() {
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: async (input: { id: number; accept: boolean }) =>
      API.post(`/invitations/${input.id}`, { accept: input.accept }),
    onSuccess: invalidate,
  });
}

export function useSentInvitationActions() {
  const invalidate = useInvalidateTeams();
  return useMutation({
    mutationFn: async (
      action:
        | { type: "reinvite"; projectId: number; handle: string; role: string | null }
        | { type: "cancel"; projectId: number; id: number },
    ) => {
      const base = `/projects/${action.projectId}/members`;
      if (action.type === "reinvite")
        await API.post(base, {
          handle: action.handle,
          ...(action.role ? { role: action.role } : {}),
        });
      else await API.delete(`${base}/${action.id}`);
    },
    onSuccess: invalidate,
  });
}
