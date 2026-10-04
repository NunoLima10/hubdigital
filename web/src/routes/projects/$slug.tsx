import { Header } from "@/components/header/header";
import { Page } from "@/layouts/page";
import { Comments } from "@/modules/comments";
import {
  ProjectDetailSidebar,
  ProjectDetailView,
} from "@/modules/project-detail/components/project-detail-view/project-detail-view";
import { useProject } from "@/modules/project-detail/hooks/use-project";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/projects/$slug")({
  component: ProjectPage,
});

function ProjectPage() {
  const { slug } = Route.useParams();
  const { data, isLoading, isError } = useProject(slug);
  return (
    <Page
      header={<Header />}
      rightSection={
        data ? (
          <div className="hidden lg:block">
            <ProjectDetailSidebar project={data} />
          </div>
        ) : undefined
      }
    >
      <div className="space-y-7">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar aos projetos
        </Link>
        {isLoading && (
          <div className="space-y-4" aria-label="A carregar projeto">
            <div className="h-16 w-72 animate-pulse rounded bg-muted" />
            <div className="aspect-video animate-pulse rounded-lg bg-muted" />
          </div>
        )}
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
