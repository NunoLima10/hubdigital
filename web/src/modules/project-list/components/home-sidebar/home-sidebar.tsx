import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileBadge } from "@/components/badge/profile-badge";
import { PersonAvatar } from "@/modules/invitations/components/person-avatar";
import { useFoundingMakers } from "@/modules/makers/hooks/use-founding-makers";
import { SiteStatsCard } from "./site-stats-card";
import { GithubProjectCard } from "./github-project-card";

function FoundingRoll() {
  const makers = useFoundingMakers();
  const people = makers.data?.data ?? [];

  return (
    <section aria-labelledby="founding-makers-title">
      <h2 id="founding-makers-title" className="mb-2 text-sm font-semibold">
        Inovadores de Cabo Verde
      </h2>

      {makers.isLoading ? (
        <ol
          className="space-y-1"
          role="status"
          aria-label="A carregar os inovadores"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="flex items-center gap-2.5 px-1 py-1.5">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <Skeleton className="h-4 flex-1" style={{ maxWidth: `${60 + ((i * 17) % 30)}%` }} />
              <Skeleton className="ml-auto h-4 w-14 shrink-0" />
            </li>
          ))}
        </ol>
      ) : makers.isError ? (
        <div className="py-3 text-sm text-muted-foreground">
          <p>Não foi possível mostrar os membros agora.</p>
          <button
            type="button"
            onClick={() => void makers.refetch()}
            className="mt-2 font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Tentar novamente
          </button>
        </div>
      ) : people.length ? (
        <ol className="space-y-1" aria-label="Primeiros membros da comunidade">
          {people.map((person) => (
            <li
              key={person.membershipNumber}
              className="flex items-center gap-2.5 rounded-md px-1 py-1.5"
            >
              <span className="relative shrink-0">
                <PersonAvatar
                  name={person.name}
                  image={person.image}
                  className="size-8 border-0"
                />
                {person.featuredBadge && (
                  <ProfileBadge
                    badgeKey={person.featuredBadge}
                    membershipNumber={person.membershipNumber}
                    className="absolute -right-1.5 -bottom-1 size-4"
                  />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {person.name}
              </span>
              <Link
                to="/profiles/$handle"
                params={{ handle: person.handle }}
                aria-label={`Ver perfil de ${person.name}`}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-primary-soft hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
              >
                Ver perfil
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="py-3 text-sm text-muted-foreground">
          Os primeiros inovadores vão aparecer aqui.
        </p>
      )}
    </section>
  );
}

export function HomeSidebar() {
  return (
    <div className="space-y-7">
      <SiteStatsCard />
      <FoundingRoll />
      <GithubProjectCard />
    </div>
  );
}
