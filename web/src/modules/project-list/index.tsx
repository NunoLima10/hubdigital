import { authClient } from "@/lib/auth-client";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { pricingLabels } from "@/modules/submit/options";
import type { ProjectMinimal } from "@/modules/submit/types/project";
import type { ListPeriod } from "@hubdigital/shared";
import { useEffect, useState } from "react";
import { ProjectCard } from "./components/project-card/project-card";
import type { ProjectFilterValues } from "./components/project-filters/project-filters";
import { SignInToVote } from "./components/sign-in-to-vote/sign-in-to-vote";
import { useProjects } from "./hooks/use-projects";
import { useToggleUpvote } from "./hooks/use-toggle-upvote";

const emptyMessages: Record<ListPeriod, string> = {
  this_week: "Ainda não há lançamentos esta semana. Sê o primeiro!",
  last_week: "Não houve lançamentos na semana passada.",
  all: "Ainda não há projetos publicados. Sê o primeiro a partilhar o teu!",
};

type Props = {
  period?: ListPeriod;
  week?: string;
  filters?: ProjectFilterValues;
  onSelect?: () => void;
};
export function ProjectList({
  period = "this_week",
  week,
  filters = {},
  onSelect,
}: Props) {
  const { data, isLoading, isError, isFetching } = useProjects({
    period,
    week,
    ...filters,
  });
  const showLoading = useDelayedLoading(isLoading);
  const { toggleUpvote, pendingProjectId } = useToggleUpvote();
  const { data: session } = authClient.useSession();
  const [voteAfterSignIn, setVoteAfterSignIn] = useState<number | null>(null);

  useEffect(() => {
    if (!session || voteAfterSignIn === null || isFetching || !data) return;
    const target = data.data.find((project) => project.id === voteAfterSignIn);
    if (target && !target.hasUpvoted) toggleUpvote(voteAfterSignIn);
    setVoteAfterSignIn(null);
  }, [session, voteAfterSignIn, data, isFetching, toggleUpvote]);

  function handleUpvote(projectId: number) {
    if (!session) {
      setVoteAfterSignIn(projectId);
      return false;
    }
    toggleUpvote(projectId);
    return true;
  }
  const hasFilters = Object.values(filters).some(Boolean);
  if (isLoading)
    return (
      showLoading ? (
        <div className="space-y-3" aria-label="A carregar projetos">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : null
    );
  if (isError)
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Não foi possível carregar os projetos. Tenta novamente mais tarde.
      </p>
    );
  if (!data?.data.length)
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {hasFilters
          ? "Nada encontrado. Tenta outros filtros."
          : week
            ? "Não houve lançamentos nesta semana."
            : emptyMessages[period]}
      </p>
    );
  return (
    <div className="divide-y-0">
      {data.data.map((project: ProjectMinimal, index: number) => (
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
          rank={index + 1}
          onUpvote={() => handleUpvote(project.id)}
          isUpvotePending={pendingProjectId === project.id}
          onSelect={onSelect}
        />
      ))}
      <SignInToVote
        opened={!session && voteAfterSignIn !== null}
        onClose={() => setVoteAfterSignIn(null)}
      />
    </div>
  );
}
