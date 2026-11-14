import { noop } from "@tanstack/react-query";
import { Header } from "@/components/header/header";
import {
  ProjectDetailSkeleton,
  ProjectDetailSidebarSkeleton,
} from "@/modules/project-detail/components/project-detail-view/project-detail-skeleton";
import { Page } from "@/layouts/page";
import { Comments } from "@/modules/comments";
import { ProjectMakers } from "@/modules/community/project-makers";
import { ProjectRequests } from "@/modules/community/project-requests";
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
import { projectHead } from "@/modules/project-detail/seo";
import { ArrowLeft } from "lucide-react";
import { RelatedProjects } from "@/modules/project-detail/components/related-projects/related-projects";
import { Button } from "@/components/ui/button";
import { isAxiosError } from "axios";
import { notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$slug")({
  loader: async ({ context, params }) => {
    let project;
    try {
      project = await context.queryClient.query(
        projectQueryOptions(params.slug),
      );
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404)
        throw notFound();
    }
    await context.queryClient
      .query(commentsQueryOptions(params.slug))
      .catch(noop);
    return project;
  },
  head: ({ loaderData, params }) => projectHead(loaderData, params.slug),
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
  const { data, isLoading, isError, refetch } = useProject(slug);
  return (
    <Page
      viewTransition
      header={<Header />}
      rightSection={
        data ? (
          <div className="hidden lg:block">
            <ProjectDetailSidebar project={data} />
          </div>
        ) : isLoading ? (
          <ProjectDetailSidebarSkeleton />
        ) : undefined
      }
    >
      {/* Extra room so the last comment does not sit against the bottom edge. */}
      <div className="space-y-7 pb-12 md:pb-16">
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
          <div className="flex flex-col items-start gap-3 rounded-lg border p-5">
            <div>
              <h1 className="font-semibold">
                Não foi possível carregar o projeto
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Verifica a ligação e tenta novamente.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
            >
              Tentar novamente
            </Button>
          </div>
        )}
        {data && (
          <>
            <ProjectDetailView project={data} />
            <div className="border-t pt-6 lg:hidden">
              <ProjectDetailSidebar
                project={data}
                showDestinationActions={false}
              />
            </div>
            <ProjectMakers projectId={data.id} author={data.author} />
            <Comments slug={slug} />
            <ProjectRequests project={data} />
            <RelatedProjects projectId={data.id} />
          </>
        )}
      </div>
    </Page>
  );
}
