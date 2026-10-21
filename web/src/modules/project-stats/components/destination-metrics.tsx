import { useQuery } from "@tanstack/react-query";
import { API } from "@/api/api";
import { projectLinkKindLabels, type DestinationStats, type StatsRange } from "@hubdigital/shared";
import { ProjectLinkIcon } from "@/components/project-link-icon";
export function DestinationMetrics({ projectId, range }: { projectId: number; range: StatsRange }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["destination-metrics", projectId, range],
    queryFn: async () => {
      const response = await API.get<{ data: DestinationStats }>(
        `/projects/${projectId}/link-stats`,
        { params: { range } },
      );
      return response.data.data.links;
    },
  });
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Cliques por link</h2>
      <p className="text-xs text-muted-foreground">
        Tentativas de abrir cada destino, incluindo cliques repetidos. Não medem pessoas únicas,
        visitas confirmadas ou inscrições. Os teus cliques e bots conhecidos são excluídos.
      </p>
      {isLoading && <p className="text-sm">A carregar cliques…</p>}
      {isError && <p className="text-sm text-destructive">Não foi possível carregar os cliques.</p>}
      {data && !data.length && (
        <p className="text-sm text-muted-foreground">Este projeto ainda não tem links.</p>
      )}
      <ul className="space-y-2">
        {data?.map((link) => (
          <li
            key={link.linkId}
            className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <ProjectLinkIcon link={link} />
              {link.label || projectLinkKindLabels[link.kind]}
            </span>
            <span className="shrink-0 tabular-nums">{link.clicks} cliques</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
