import { noop } from "@tanstack/react-query";
import { Header } from "@/components/header/header";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { Page } from "@/layouts/page";
import { ProjectCard } from "@/modules/project-list/components/project-card/project-card";
import { makerQueryOptions, useMaker } from "@/modules/makers/hooks/use-maker";
import {
  pricingLabels,
  availabilityLabels,
  projectStageLabels,
} from "@/modules/submit/options";
import { Link, createFileRoute } from "@tanstack/react-router";
import { makerHead } from "@/modules/makers/seo";
import {
  Github,
  Globe,
  Instagram,
  Linkedin,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { ProfileBadge } from "@/components/badge/profile-badge";
import { ProfileAchievements } from "@/modules/badges/components/profile-achievements";
import { SiteFooter } from "@/components/site-footer/site-footer";

export const Route = createFileRoute("/profiles/$handle")({
  loader: ({ context, params }) =>
    context.queryClient.query(makerQueryOptions(params.handle)).catch(noop),
  head: ({ loaderData, params }) => makerHead(loaderData, params.handle),
  component: ProfilePage,
});

function ProfilePage() {
  const { handle } = Route.useParams();
  const { data, isLoading, isError } = useMaker(handle);
  const showLoading = useDelayedLoading(isLoading);
  return (
    <Page header={<Header />} footer={<SiteFooter />}>
      {showLoading && (
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
          <header className="grid gap-5 rounded-xl border bg-card p-5 sm:grid-cols-[auto_1fr] sm:p-6 lg:grid-cols-[auto_1fr_auto]">
            <span className="relative size-20 shrink-0">
              <span className="flex size-full items-center justify-center overflow-hidden rounded-full border bg-muted text-muted-foreground">
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
              {data.featuredBadge && (
                <ProfileBadge
                  badgeKey={data.featuredBadge}
                  membershipNumber={data.membershipNumber}
                  className="absolute -right-2 -bottom-2"
                />
              )}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold">{data.name}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                @{data.handle}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Perfil profissional
              </p>
              {data.bio && (
                <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-6">
                  {data.bio}
                </p>
              )}
              <nav
                aria-label={`Links de ${data.name}`}
                className="mt-4 flex flex-wrap gap-2"
              >
                {data.websiteUrl && (
                  <a
                    href={data.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <Globe className="size-4" />
                    Site
                  </a>
                )}
                {data.githubUrl && (
                  <a
                    href={data.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium text-foreground hover:bg-muted"
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
                    className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <Linkedin className="size-4" />
                    LinkedIn
                  </a>
                )}
                {data.instagramUrl && (
                  <a
                    href={data.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <Instagram className="size-4" />
                    Instagram
                  </a>
                )}
                {data.discordUrl && (
                  <a
                    href={data.discordUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <MessageCircle className="size-4" />
                    Discord
                  </a>
                )}
              </nav>
            </div>
            <div className="flex self-start overflow-hidden rounded-lg border text-center text-sm sm:col-start-2 lg:col-start-auto">
              <div>
                <strong className="block px-5 pt-3 text-lg tabular-nums">
                  {data.projectCount}
                </strong>
                <span className="block px-5 pb-3 text-muted-foreground">
                  Projetos
                </span>
              </div>
              <div className="border-l">
                <strong className="block px-5 pt-3 text-lg tabular-nums">
                  {data.totalUpvotes}
                </strong>
                <span className="block px-5 pb-3 text-muted-foreground">
                  Votos
                </span>
              </div>
            </div>
          </header>
          {data.badges.length > 0 && (
            <ProfileAchievements
              badges={data.badges}
              membershipNumber={data.membershipNumber}
            />
          )}
          {[
            {
              title: "Projetos publicados",
              projects: data.ownedProjects ?? [],
              empty: "Ainda não publicou nenhum projeto.",
            },
            {
              title: "Participações em equipas",
              projects: data.collaborations ?? [],
              empty: "Ainda não tem colaborações públicas.",
            },
          ].map((section) => (
            <section key={section.title} className="border-t pt-6">
              <h2 className="mb-3 text-lg font-semibold">{section.title}</h2>
              {section.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">{section.empty}</p>
              ) : (
                section.projects.map((project) => (
                  <div key={project.id}>
                    {"contributionRole" in project &&
                      Boolean(project.contributionRole) && (
                        <p className="px-3 pt-2 text-xs text-muted-foreground">
                          Papel no projeto: {String(project.contributionRole)}
                        </p>
                      )}
                    <ProjectCard
                      key={project.id}
                      id={project.id}
                      slug={project.slug}
                      title={project.name}
                      description={project.shortDescription}
                      iconUrl={project.logoUrl ?? undefined}
                      topis={
                        [
                          project.category?.name,
                          project.pricing
                            ? pricingLabels[project.pricing]
                            : undefined,
                          project.availability === "not_available" &&
                          project.projectStage
                            ? projectStageLabels[project.projectStage]
                            : project.availability
                              ? availabilityLabels[project.availability]
                              : undefined,
                        ].filter(Boolean) as string[]
                      }
                      upCount={project.upvoteCount}
                      hasUpvoted={project.hasUpvoted}
                      commentCount={project.commentCount}
                    />
                  </div>
                ))
              )}
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}

