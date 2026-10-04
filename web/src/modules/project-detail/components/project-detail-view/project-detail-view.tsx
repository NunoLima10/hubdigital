import { ProjectBanner } from "@/components/project-banner/project-banner";
import {
  ProjectSummary,
  ProjectVoteButton,
} from "@/components/project-summary/project-summary";
import { authClient } from "@/lib/auth-client";
import { SignInToVote } from "@/modules/project-list/components/sign-in-to-vote/sign-in-to-vote";
import { useToggleUpvote } from "@/modules/project-list/hooks/use-toggle-upvote";
import { ModerationNotice } from "@/modules/releases/components/moderation-notice/moderation-notice";
import { ReportButton } from "@/modules/reports/components/report-button/report-button";
import { useTrackProjectView } from "@/modules/project-stats/hooks/use-track-project-view";
import { trackProjectEvent } from "@/modules/project-stats/utils/track-project-event";
import {
  accessLabels,
  audienceLabels,
  businessModelLabels,
  platformLabels,
  pricingLabels,
  projectStageLabels,
} from "@/modules/submit/options";
import type { Project } from "@/modules/submit/types/project";
import { formatLocation } from "@hubdigital/shared";
import { ExternalLink, Github, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ProjectAuthorRow } from "../project-author/project-author";

function MetadataRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 border-b py-3 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

export function ProjectDetailView({ project }: { project: Project }) {
  useTrackProjectView(project.id);
  const { data: session } = authClient.useSession();
  const { toggleUpvote, pendingProjectId } = useToggleUpvote();
  const [voteAfterSignIn, setVoteAfterSignIn] = useState(false);

  useEffect(() => {
    if (session && voteAfterSignIn && !project.hasUpvoted) {
      toggleUpvote(project.id);
      setVoteAfterSignIn(false);
    }
  }, [session, voteAfterSignIn, project.id, project.hasUpvoted, toggleUpvote]);

  return (
    <div className="space-y-6">
      <ModerationNotice project={project} />
      <ProjectSummary
        iconUrl={project.logoUrl}
        description={project.shortDescription}
        topics={[
          ...(project.category ? [project.category.name] : []),
          ...project.platform.map((platform) => platformLabels[platform]),
        ]}
        title={
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {project.name}
          </h1>
        }
        actions={
          <ProjectVoteButton
            title={project.name}
            count={project.upvoteCount}
            active={project.hasUpvoted}
            disabled={pendingProjectId === project.id}
            onClick={() =>
              session ? toggleUpvote(project.id) : setVoteAfterSignIn(true)
            }
          />
        }
      />
      <ProjectBanner bannerUrl={project.bannerImageUrl} />
      <section aria-labelledby="about-project-title">
        <h2 id="about-project-title" className="text-lg font-semibold">
          Sobre o projeto
        </h2>
        {project.description ? (
          <div
            className="prose-project mt-3 text-sm"
            dangerouslySetInnerHTML={{ __html: project.description }}
          />
        ) : (
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {project.shortDescription}
          </p>
        )}
      </section>
      <SignInToVote
        opened={!session && voteAfterSignIn}
        onClose={() => setVoteAfterSignIn(false)}
      />
    </div>
  );
}

export function ProjectDetailSidebar({ project }: { project: Project }) {
  function share() {
    if (navigator.share)
      void navigator.share({ title: project.name, url: location.href });
    else void navigator.clipboard.writeText(location.href);
  }
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Publicado por
        </h2>
        <ProjectAuthorRow author={project.author} />
      </section>
      <a
        href={project.websiteUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackProjectEvent(project.id, "visit")}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85"
      >
        <ExternalLink className="size-4" />
        Visitar projeto
      </a>
      <dl>
        {project.launchedAt && (
          <MetadataRow label="Lançamento">
            {new Date(project.launchedAt).toLocaleDateString("pt-CV")}
          </MetadataRow>
        )}
        <MetadataRow label="Categoria">
          {project.category?.name ?? "—"}
        </MetadataRow>
        <MetadataRow label="Localização">
          {project.location ? formatLocation(project.location) : "—"}
        </MetadataRow>
        <MetadataRow label="Preço">
          {pricingLabels[project.pricing]}
        </MetadataRow>
        <MetadataRow label="Maturidade">
          {projectStageLabels[project.projectStage]}
        </MetadataRow>
        <MetadataRow label="Público-alvo">
          {audienceLabels[project.audienceStage]}
        </MetadataRow>
        <MetadataRow label="Modelo de negócio">
          {businessModelLabels[project.businessModel]}
        </MetadataRow>
        <MetadataRow label="Acesso">{accessLabels[project.access]}</MetadataRow>
        <MetadataRow label="Plataformas">
          {project.platform
            .map((platform) => platformLabels[platform])
            .join(", ")}
        </MetadataRow>
      </dl>
      {project.githubUrl && (
        <a
          href={project.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Github className="size-4" />
          Ver código no GitHub
        </a>
      )}
      <div className="flex gap-2">
        <button
          onClick={share}
          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border text-sm hover:bg-muted"
        >
          <Share2 className="size-4" />
          Partilhar
        </button>
        <ReportButton targetType="project" targetId={project.id} size="sm" />
      </div>
    </div>
  );
}
