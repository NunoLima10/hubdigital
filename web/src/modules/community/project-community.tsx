import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { API } from "@/api/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  announcementKindLabels,
  type Announcement,
  type MakerMembership,
} from "@hubdigital/shared";
export function Announcements({ projectId }: { projectId?: number }) {
  const { data: session } = authClient.useSession();
  const cache = useQueryClient();
  const {
    data: pages,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["announcements", "feed", projectId, session?.user.id ?? null],
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) =>
      (
        await API.get<{ data: Announcement[] }>("/announcements", {
          params: { projectId, offset: pageParam, limit: 50 },
          signal,
        })
      ).data.data,
    getNextPageParam: (last, all) =>
      last.length === 50 ? all.reduce((total, page) => total + page.length, 0) : undefined,
  });
  const data = [
    ...new Map(
      (pages?.pages.flat() ?? []).map((announcement) => [announcement.id, announcement]),
    ).values(),
  ];
  const vote = useMutation({
    mutationFn: async (id: number) => API.post(`/announcements/${id}/vote`),
    onSuccess: () => cache.invalidateQueries({ queryKey: ["announcements"] }),
  });
  if (projectId && !data.length && !isError) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">
        {projectId ? "Novidades do projeto" : "Esta semana na comunidade"}
      </h2>
      {!projectId && (
        <p className="text-xs text-muted-foreground">
          Anúncios com votos próprios. A semana começa à segunda-feira em Cabo Verde.
        </p>
      )}
      {isError && (
        <p className="text-sm text-destructive">Não foi possível carregar os anúncios.</p>
      )}
      {isLoading && <p className="text-sm text-muted-foreground">A carregar anúncios…</p>}
      {isError && (
        <Button variant="outline" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      )}
      {!isLoading && !isError && !data.length && (
        <p className="text-sm text-muted-foreground">
          Ainda não há anúncios {projectId ? "para este projeto" : "nesta semana"}.
        </p>
      )}
      <ul className="space-y-3">
        {data.map((announcement) => (
          <li key={announcement.id} className="space-y-2 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                to="/projects/$slug"
                params={{ slug: announcement.project.slug }}
                className="font-semibold hover:underline"
              >
                {announcement.project.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {announcementKindLabels[announcement.kind]}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{announcement.introduction}</p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {announcement.publishedAt &&
                  new Date(announcement.publishedAt).toLocaleDateString("pt-CV", {
                    timeZone: "Atlantic/Cape_Verde",
                  })}{" "}
                · Cabo Verde
              </span>
              <Button
                type="button"
                size="sm"
                variant={announcement.hasVoted ? "default" : "outline"}
                disabled={!session || vote.isPending}
                aria-pressed={announcement.hasVoted}
                onClick={() => vote.mutate(announcement.id)}
              >
                {announcement.votes} · Apoiar anúncio
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {!session && data.length > 0 && (
        <Link to="/sign-in" className="text-sm text-primary hover:underline">
          Entrar para apoiar anúncios
        </Link>
      )}
      {hasNextPage && (
        <Button
          type="button"
          variant="outline"
          disabled={isFetchingNextPage}
          onClick={() => void fetchNextPage()}
        >
          {isFetchingNextPage ? "A carregar…" : "Carregar mais anúncios"}
        </Button>
      )}
      {vote.isError && (
        <p className="text-sm text-destructive">
          Não foi possível registar o apoio. Tenta novamente.
        </p>
      )}
    </section>
  );
}
export function ProjectMakers({ projectId }: { projectId: number }) {
  const { data: session } = authClient.useSession();
  const { data = [] } = useQuery({
    queryKey: ["project-makers", projectId, session?.user.id ?? null],
    queryFn: async () =>
      (await API.get<{ data: MakerMembership[] }>(`/projects/${projectId}/makers`)).data.data,
  });
  const accepted = data.filter((maker) => maker.status === "accepted");
  if (!accepted.length) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">Criadores</h2>
      <ul className="flex flex-wrap gap-3">
        {accepted.map((maker) => (
          <li key={maker.id} className="text-sm">
            {maker.handle ? (
              <Link
                to="/makers/$handle"
                params={{ handle: maker.handle }}
                className="text-primary hover:underline"
              >
                {maker.name}
              </Link>
            ) : (
              maker.name
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
