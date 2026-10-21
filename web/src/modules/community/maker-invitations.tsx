import { authClient } from "@/lib/auth-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API } from "@/api/api";
import { Button } from "@/components/ui/button";
export function MakerInvitations() {
  const { data: session } = authClient.useSession();
  const cache = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["maker-invitations", session?.user.id ?? null],
    enabled: Boolean(session),
    queryFn: async () =>
      (
        await API.get<{ data: { id: number; projectId: number; name: string }[] }>(
          "/maker-invitations",
        )
      ).data.data,
  });
  const reply = useMutation({
    mutationFn: async (input: { id: number; accept: boolean }) =>
      API.post(`/maker-invitations/${input.id}`, { accept: input.accept }),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["maker-invitations"] });
      cache.invalidateQueries({ queryKey: ["project-makers"] });
      cache.invalidateQueries({ queryKey: ["maker"] });
    },
  });
  if (!data.length) return null;
  return (
    <section className="mb-6 space-y-3">
      <h2 className="text-sm font-semibold">Convites para participar como criador</h2>
      {data.map((invitation) => (
        <div
          key={invitation.id}
          className="flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm"
        >
          <span className="flex-1">{invitation.name}</span>
          <Button
            disabled={reply.isPending}
            onClick={() => reply.mutate({ id: invitation.id, accept: true })}
          >
            Aceitar autoria
          </Button>
          <Button
            variant="outline"
            disabled={reply.isPending}
            onClick={() => reply.mutate({ id: invitation.id, accept: false })}
          >
            Recusar
          </Button>
        </div>
      ))}
      {reply.isError && (
        <p className="text-sm text-destructive">Não foi possível responder. Tenta novamente.</p>
      )}
    </section>
  );
}
