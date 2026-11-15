import { Link } from "@tanstack/react-router";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { ProfileBadge } from "@/components/badge/profile-badge";
import { PersonAvatar } from "@/modules/invitations/components/person-avatar";
import { useFoundingMakers } from "@/modules/makers/hooks/use-founding-makers";

function FoundingRoll() {
  const makers = useFoundingMakers();
  const people = makers.data?.data ?? [];

  return (
    <section aria-labelledby="founding-makers-title">
      <h2 id="founding-makers-title" className="mb-2 text-sm font-semibold">
        Inovadores de Cabo Verde
      </h2>

      {makers.isLoading ? (
        <div
          className="flex items-center gap-2 py-4 text-sm text-muted-foreground"
          role="status"
        >
          <LoaderCircle
            className="size-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          A descobrir os pioneiros…
        </div>
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
                Perfil
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
      <FoundingRoll />
      <section className="hidden rounded-lg border bg-muted/40 p-5 lg:block">
        <h2 className="font-semibold">Feito em Cabo Verde</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Descobre produtos, ferramentas e ideias criadas pela comunidade
          cabo-verdiana.
        </p>
        <Link
          to="/dashboard/submit"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Partilhar um projeto <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}
