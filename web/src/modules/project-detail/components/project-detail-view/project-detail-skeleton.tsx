import { ProjectSummary } from "@/components/project-summary/project-summary";
import { projectViewTransitionName, useProjectViewTransition } from "@/lib/project-view-transition";

export function ProjectDetailSkeleton({ slug }: { slug: string }) {
  const selected = useProjectViewTransition();
  const project = selected?.slug === slug ? selected : null;

  return (
    <div className="space-y-6" aria-busy="true" aria-label="A carregar projeto">
      {project ? (
        <ProjectSummary
          viewTransitionName={projectViewTransitionName(project.projectId)}
          iconUrl={project.iconUrl}
          iconClassName="size-16 sm:size-20"
          title={<h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{project.title}</h1>}
          description={project.description}
          topics={project.topics}
          actions={<div className="size-[52px] animate-pulse rounded-md bg-muted" aria-hidden="true" />}
        />
      ) : (
        <div className="flex items-center gap-3 sm:gap-4" aria-hidden="true">
          <div className="size-16 shrink-0 animate-pulse rounded-lg bg-muted sm:size-20" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-7 w-2/3 animate-pulse rounded bg-muted sm:h-8" />
            <div className="h-5 w-full animate-pulse rounded bg-muted" />
            <div className="hidden h-5 w-1/3 animate-pulse rounded bg-muted sm:block" />
          </div>
          <div className="size-[52px] shrink-0 animate-pulse rounded-md bg-muted" />
        </div>
      )}
      <div className="aspect-video animate-pulse rounded-lg border bg-muted" aria-hidden="true" />
      <div className="space-y-3" aria-hidden="true">
        <div className="h-7 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function ProjectDetailSidebarSkeleton() {
  return (
    <div className="hidden space-y-6 lg:block" aria-hidden="true">
      <div className="h-16 animate-pulse rounded-lg bg-muted" />
      <div className="h-10 animate-pulse rounded-md bg-muted" />
      <div className="space-y-4">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-8 animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}
