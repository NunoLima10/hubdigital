import { ProjectList } from "@/modules/project-list";
import { useProjects } from "@/modules/project-list/hooks/use-projects";

export function RelatedProjects({
  projectId,
  categoryId,
}: {
  projectId: number;
  categoryId?: number | null;
}) {
  const query = {
    period: "all" as const,
    sort: "upvotes" as const,
    categoryId: categoryId ?? undefined,
    limit: 4,
  };
  const { data, isLoading, isError } = useProjects(query);
  const related = data?.data.filter((project) => project.id !== projectId) ?? [];

  if (!categoryId || isLoading || isError || related.length === 0) return null;

  return (
    <section aria-labelledby="related-projects-title" className="border-t pt-6">
      <div className="mb-2">
        <h2 id="related-projects-title" className="text-lg font-semibold">
          Outros projetos para descobrir
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mais projetos da mesma categoria, escolhidos pela comunidade.
        </p>
      </div>
      <ProjectList
        period={query.period}
        sort={query.sort}
        limit={query.limit}
        filters={{ categoryId }}
        excludeProjectId={projectId}
        hideWhenEmpty
        transitionScope={`related:${projectId}`}
      />
    </section>
  );
}
