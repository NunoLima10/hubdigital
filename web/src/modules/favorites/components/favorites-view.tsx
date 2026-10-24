import { Button, buttonVariants } from "@/components/ui/button";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { ProjectCard } from "@/modules/project-list/components/project-card/project-card";
import {
  availabilityLabels,
  pricingLabels,
  projectStageLabels,
} from "@/modules/submit/options";
import { Link } from "@tanstack/react-router";
import { useFavorites, useToggleFavorite } from "../hooks/use-favorites";

export function FavoritesView() {
  const { data, isLoading, isError, refetch } = useFavorites();
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
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div>
          <h2 className="font-semibold">
            Não foi possível carregar os favoritos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verifica a ligação e tenta novamente.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </div>
    );

  if (!data?.data.length)
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div>
          <h2 className="font-semibold">Ainda não guardaste nenhum projeto</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Explora os lançamentos e guarda os projetos que queres acompanhar.
          </p>
        </div>
        <Link to="/" className={buttonVariants({ variant: "outline" })}>
          Explorar projetos
        </Link>
      </div>
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
          iconUrl={project.logoUrl ?? undefined}
          topis={
            [project.category?.name, (project.pricing ? pricingLabels[project.pricing] : undefined),
                      (project.availability === "not_available" && project.projectStage ? projectStageLabels[project.projectStage] : project.availability ? availabilityLabels[project.availability] : undefined)].filter(
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
