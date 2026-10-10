import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { pricingLabels } from "@/modules/submit/options";
import { ProjectCard } from "@/modules/project-list/components/project-card/project-card";
import { useFavorites, useToggleFavorite } from "../hooks/use-favorites";

export function FavoritesView() {
  const { data, isLoading, isError } = useFavorites();
  const showLoading = useDelayedLoading(isLoading);
  const { toggleFavorite, pendingProjectId } = useToggleFavorite();

  if (isLoading)
    return showLoading ? (
      <div className="space-y-3" aria-label="A carregar favoritos">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    ) : null;

  if (isError)
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Não foi possível carregar os favoritos.
      </p>
    );

  if (!data?.data.length)
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Ainda não guardaste nenhum projeto.
      </p>
    );

  return (
    <div>
      {data.data.map((project) => (
        <ProjectCard
          key={project.id}
          id={project.id}
          slug={project.slug}
          title={project.name}
          description={project.shortDescription}
          website={project.websiteUrl}
          iconUrl={project.logoUrl ?? undefined}
          topis={
            [project.category?.name, pricingLabels[project.pricing]].filter(
              Boolean,
            ) as string[]
          }
          upCount={project.upvoteCount}
          hasUpvoted={project.hasUpvoted}
          commentCount={project.commentCount}
          favorited
          onFavorite={() => toggleFavorite(project.id)}
          isFavoritePending={pendingProjectId === project.id}
        />
      ))}
    </div>
  );
}
