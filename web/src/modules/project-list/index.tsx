import { authClient } from "@/lib/auth-client";
import { ProjectDetailModal } from "@/modules/project-detail/components/project-detail-modal/project-detail-modal";
import { pricingLabels } from "@/modules/submit/options";
import { ProjectMinimal } from "@/modules/submit/types/project";
import type { ListPeriod } from "@hubdigital/shared";
import { Stack, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { Projectcard } from "./components/project-card/project-card";
import type { ProjectFilterValues } from "./components/project-filters/project-filters";
import { SignInToVote } from "./components/sign-in-to-vote/sign-in-to-vote";
import { useProjects } from "./hooks/use-projects";
import { useToggleUpvote } from "./hooks/use-toggle-upvote";

function toCardProps(project: ProjectMinimal) {
  return {
    id: project.id,
    slug: project.slug,
    title: project.name,
    description: project.shortDescription,
    website: project.websiteUrl,
    iconUrl: project.logoUrl ?? undefined,
    topis: [project.category?.name, pricingLabels[project.pricing]].filter(
      Boolean
    ) as string[],
    upCount: project.upvoteCount,
    hasUpvoted: project.hasUpvoted,
    commentCount: project.commentCount,
  };
}

const emptyMessages: Record<ListPeriod, string> = {
  this_week: "Ainda não há lançamentos esta semana. Sê o primeiro!",
  last_week: "Não houve lançamentos na semana passada.",
  all: "Ainda não há projetos publicados. Sê o primeiro a partilhar o teu!",
};

type ProjectListProps = {
  period?: ListPeriod;
  /** Renders one archived weekly ranking instead of a relative period. */
  week?: string;
  filters?: ProjectFilterValues;
};

export function ProjectList({
  period = "this_week",
  week,
  filters = {},
}: ProjectListProps) {
  const { data, isLoading, isError, isFetching } = useProjects({
    period,
    week,
    ...filters,
  });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { toggleUpvote, pendingProjectId } = useToggleUpvote();

  const hasFilters = Object.values(filters).some(Boolean);

  const { data: session } = authClient.useSession();
  // Set when a logged-out visitor tries to vote; replayed once they sign in.
  const [voteAfterSignIn, setVoteAfterSignIn] = useState<number | null>(null);

  useEffect(() => {
    if (!session || voteAfterSignIn === null) return;

    // Wait for the listing to be refetched as this user. The query key carries
    // the viewer id, so signing in swaps in a fresh entry; acting on the
    // anonymous one would toggle a vote this account had already cast and
    // silently remove it.
    if (isFetching || !data) return;

    const target = data.data.find((project) => project.id === voteAfterSignIn);
    if (target && !target.hasUpvoted) {
      toggleUpvote(voteAfterSignIn);
    }

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

  if (isLoading) {
    return (
      <Stack gap={40}>
        <Projectcard.Loading />
        <Projectcard.Loading />
        <Projectcard.Loading />
      </Stack>
    );
  }

  if (isError) {
    return (
      <Stack align="center" py="xl">
        <Text c="dimmed">
          Não foi possível carregar os projetos. Tenta novamente mais tarde.
        </Text>
      </Stack>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <Stack align="center" py="xl">
        <Text c="dimmed">
          {hasFilters
            ? "Nada encontrado. Tenta outros filtros."
            : week
              ? "Não houve lançamentos nesta semana."
              : emptyMessages[period]}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap={40}>
      {data.data.map((project, index) => (
        <Projectcard
          key={project.id}
          {...toCardProps(project)}
          rank={index + 1}
          onOpen={() => setSelectedIndex(index)}
          onUpvote={() => handleUpvote(project.id)}
          isUpvotePending={pendingProjectId === project.id}
        />
      ))}
      <ProjectDetailModal
        projects={data.data}
        index={selectedIndex}
        onIndexChange={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
      />
      <SignInToVote
        opened={!session && voteAfterSignIn !== null}
        onClose={() => setVoteAfterSignIn(null)}
      />
    </Stack>
  );
}
