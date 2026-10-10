import { Header } from "@/components/header/header";
import { ProjectDetailSkeleton, ProjectDetailSidebarSkeleton } from "@/modules/project-detail/components/project-detail-view/project-detail-skeleton";
import { Page } from "@/layouts/page";
import { Comments } from "@/modules/comments";
import { commentsQueryOptions } from "@/modules/comments/hooks/use-comments";
import {
  ProjectDetailSidebar,
  ProjectDetailView,
} from "@/modules/project-detail/components/project-detail-view/project-detail-view";
import {
  projectQueryOptions,
  useProject,
} from "@/modules/project-detail/hooks/use-project";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/projects/$slug")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(projectQueryOptions(params.slug)),
      context.queryClient.prefetchQuery(commentsQueryOptions(params.slug)),
    ]);
  },
  component: ProjectPage,
  pendingComponent: ProjectPendingPage,
});

function ProjectPendingPage() {
  const { slug } = Route.useParams();
  return (
    <Page
      viewTransition
      header={<Header />}
      rightSection={<ProjectDetailSidebarSkeleton />}
    >
      <div className="space-y-7">
        <Link
          to="/"
          viewTransition
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar aos projetos
        </Link>
        <ProjectDetailSkeleton slug={slug} />
      </div>
    </Page>
  );
}

function ProjectPage() {
  const { slug } = Route.useParams();
  const { data, isLoading, isError } = useProject(slug);
  return (
    <Page
      viewTransition
      header={<Header />}
      rightSection={
        data ? (
          <div className="hidden lg:block">
            <ProjectDetailSidebar project={data} />
          </div>
        ) : isLoading ? <ProjectDetailSidebarSkeleton /> : undefined
      }
    >
      <div className="space-y-7">
        <Link
          to="/"
          viewTransition
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar aos projetos
        </Link>
        {isLoading && <ProjectDetailSkeleton slug={slug} />}
        {isError && (
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar este projeto.
          </p>
        )}
        {data && (
          <>
            <ProjectDetailView project={data} />
            <div className="border-t pt-6 lg:hidden">
              <ProjectDetailSidebar project={data} />
            </div>
            <Comments slug={slug} />
          </>
        )}
      </div>
    </Page>
  );
}
