import { Header } from "@/components/header/header";
import { Page } from "@/layouts/page";
import { ProjectCard } from "@/modules/project-list/components/project-card/project-card";
import { useMaker } from "@/modules/makers/hooks/use-maker";
import { pricingLabels } from "@/modules/submit/options";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Github, Globe, Linkedin, UserRound } from "lucide-react";

export const Route = createFileRoute("/makers/$handle")({
  component: MakerPage,
});

function MakerPage() {
  const { handle } = Route.useParams();
  const { data, isLoading, isError } = useMaker(handle);
  return (
    <Page header={<Header />}>
      {isLoading && (
        <div className="space-y-4" aria-label="A carregar perfil">
          <div className="size-20 animate-pulse rounded-full bg-muted" />
          <div className="h-8 w-60 animate-pulse rounded bg-muted" />
        </div>
      )}
      {isError && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Não encontrámos este perfil.{" "}
          <Link to="/" className="text-primary hover:underline">
            Voltar aos lançamentos
          </Link>
        </div>
      )}
      {data && (
        <div className="space-y-8">
          <div className="flex flex-wrap items-start gap-5">
            <span className="flex size-18 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground">
              {data.image ? (
                <img
                  src={data.image}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <UserRound className="size-8" />
              )}
            </span>
            <div className="min-w-60 flex-1">
              <h1 className="text-2xl font-semibold">{data.name}</h1>
              <p className="text-sm text-muted-foreground">@{data.handle}</p>
              {data.bio && <p className="mt-2 text-sm leading-6">{data.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-primary">
                {data.websiteUrl && (
                  <a
                    href={data.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    <Globe className="size-4" />
                    Website
                  </a>
                )}
                {data.githubUrl && (
                  <a
                    href={data.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    <Github className="size-4" />
                    GitHub
                  </a>
                )}
                {data.linkedinUrl && (
                  <a
                    href={data.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    <Linkedin className="size-4" />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-6 rounded-lg border px-5 py-3 text-center text-sm">
              <div>
                <strong className="block text-lg tabular-nums">
                  {data.projectCount}
                </strong>
                <span className="text-muted-foreground">Projetos</span>
              </div>
              <div>
                <strong className="block text-lg tabular-nums">
                  {data.totalUpvotes}
                </strong>
                <span className="text-muted-foreground">Votos</span>
              </div>
            </div>
          </div>
          <section className="border-t pt-6">
            <h2 className="mb-3 text-lg font-semibold">Lançamentos</h2>
            {data.projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não publicou nenhum projeto.
              </p>
            ) : (
              data.projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  slug={project.slug}
                  title={project.name}
                  description={project.shortDescription}
                  website={project.websiteUrl}
                  iconUrl={project.logoUrl ?? undefined}
                  topis={
                    [
                      project.category?.name,
                      pricingLabels[project.pricing],
                    ].filter(Boolean) as string[]
                  }
                  upCount={project.upvoteCount}
                  hasUpvoted={project.hasUpvoted}
                  commentCount={project.commentCount}
                />
              ))
            )}
          </section>
        </div>
      )}
    </Page>
  );
}
