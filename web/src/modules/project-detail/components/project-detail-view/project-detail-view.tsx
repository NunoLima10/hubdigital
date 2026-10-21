import { ProjectMakers, Announcements } from "@/modules/community/project-community";
import { ProjectProfile } from "@/components/project-profile";
import { ProjectDestinationActions } from "@/components/project-destination-actions";
import { ProjectGallery } from "@/components/project-gallery/project-gallery";
import { projectViewTransitionName } from "@/lib/project-view-transition";
import { Button } from "@/components/ui/button";
import {
  ProjectSummary,
  ProjectVoteButton,
} from "@/components/project-summary/project-summary";
import { authClient } from "@/lib/auth-client";
import { SignInToVote } from "@/modules/project-list/components/sign-in-to-vote/sign-in-to-vote";
import { useToggleUpvote } from "@/modules/project-list/hooks/use-toggle-upvote";
import { ModerationNotice } from "@/modules/releases/components/moderation-notice/moderation-notice";
import { ReportButton } from "@/modules/reports/components/report-button/report-button";
import {
  useFavorites,
  useToggleFavorite,
} from "@/modules/favorites/hooks/use-favorites";
import { useTrackProjectView } from "@/modules/project-stats/hooks/use-track-project-view";
import { trackDestinationClick } from "@/modules/project-stats/utils/track-project-event";
import {
  availabilityLabels,
  sourceModelLabels,
  audienceLabels,
  businessModelLabels,
  platformLabels,
  pricingLabels,
  projectStageLabels,
} from "@/modules/submit/options";
import type { Project } from "@/modules/submit/types/project";
import { ProjectGeography } from "@/components/project-geography";
import { FavoriteHeart, type FavoriteHeartHandle } from "@/components/favorite-heart/favorite-heart";
import { cn } from "@/lib/utils";
import { Check, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
        viewTransitionName={projectViewTransitionName(project.id)}
        iconUrl={project.logoUrl}
        iconClassName="size-16 sm:size-20"
        description={project.shortDescription}
        topics={[
          ...(project.category ? [project.category.name] : []),
          ...project.secondaryCategories.map((category) => category.name),
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
      <ProjectMakers projectId={project.id} />
      <ProjectGallery
        imageUrls={project.galleryImageUrls}
        youtubeVideoId={project.youtubeVideoId}
        projectName={project.name}
      />
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
      <Announcements projectId={project.id} />
      <SignInToVote
        opened={!session && voteAfterSignIn}
        onClose={() => setVoteAfterSignIn(false)}
      />
    </div>
  );
}

export function ProjectDetailSidebar({ project }: { project: Project }) {
  const { data: session } = authClient.useSession();
  const { data: favorites } = useFavorites(Boolean(session));
  const { toggleFavorite, pendingProjectId } = useToggleFavorite();
  const favorited = favorites?.data.some((item) => item.id === project.id) ?? false;
  const heart = useRef<FavoriteHeartHandle>(null);
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Publicado por
        </h2>
        <ProjectAuthorRow author={project.author} />
      </section>
      <ProjectDestinationActions links={project.links} availability={project.availability} onVisit={link => trackDestinationClick(link.id)} />
      <dl>
        {project.publishedAt && <MetadataRow label="Publicado no Hub Digital">{new Date(project.publishedAt).toLocaleDateString("pt-CV")}</MetadataRow>}
        <MetadataRow label="Categorias"><div className="space-y-1">{project.category && <p>{project.category.name} <span className="text-xs text-muted-foreground">(principal)</span></p>}{project.secondaryCategories.map((category) => <p key={category.id}>{category.name}</p>)}</div></MetadataRow>
        <ProjectGeography project={project} />
        <ProjectProfile project={project} />
        {project.availability && <MetadataRow label="Disponibilidade">{availabilityLabels[project.availability]}</MetadataRow>}
        {project.projectStage && <MetadataRow label="Fase">{projectStageLabels[project.projectStage]}</MetadataRow>}
        {project.pricing && <MetadataRow label="Monetização">{pricingLabels[project.pricing]}</MetadataRow>}
        {project.audiences.length > 0 && <MetadataRow label="Para quem">{project.audiences.map((audience) => audienceLabels[audience]).join(", ")}</MetadataRow>}
        {project.businessModel && <MetadataRow label="Modelo de negócio">{businessModelLabels[project.businessModel]}</MetadataRow>}
        {project.sourceModel && <MetadataRow label="Código-fonte">{sourceModelLabels[project.sourceModel]}</MetadataRow>}
        {project.licenseId && <MetadataRow label="Licença">{project.licenseId}</MetadataRow>}
        {project.platform.length > 0 && <MetadataRow label="Plataformas">{project.platform.map((platform) => platformLabels[platform]).join(", ")}</MetadataRow>}
      </dl>
      {session && (
        <Button
          variant="outline"
          className="w-full"
          disabled={pendingProjectId === project.id}
          aria-pressed={favorited}
          onClick={() => {
            heart.current?.arm();
            toggleFavorite(project.id);
          }}
        >
          <FavoriteHeart ref={heart} active={favorited} />
          {favorited ? "Remover dos favoritos" : "Guardar nos favoritos"}
        </Button>
      )}
      <div className="flex gap-2">
        <ShareLinkButton title={project.name} />
        <ReportButton targetType="project" targetId={project.id} size="sm" />
      </div>
    </div>
  );
}

// Phones get the native share sheet; everywhere else the link is copied and
// the icon briefly turns into a check, which is quicker than a share dialog.
function ShareLinkButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function share() {
    const url = location.href;
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title, url });
      } catch {
        // Closing the share sheet rejects too; nothing to report.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado para a área de transferência.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  const iconClass = "absolute inset-0 size-4 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.3,1.4,0.5,1)] motion-reduce:transition-none";
  return (
    <button
      onClick={share}
      className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border text-sm hover:bg-muted"
    >
      <span aria-hidden="true" className="relative size-4">
        <Share2 className={cn(iconClass, copied && "scale-50 -rotate-45 opacity-0")} />
        <Check className={cn(iconClass, "text-primary", !copied && "scale-50 rotate-45 opacity-0")} />
      </span>
      <span aria-live="polite">{copied ? "Link copiado" : "Partilhar"}</span>
    </button>
  );
}
