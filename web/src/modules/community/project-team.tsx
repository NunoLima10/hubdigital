import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { API } from "@/api/api";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";
import type { ProjectMember, ProjectAuthor } from "@hubdigital/shared";

export function ProjectTeam({
  projectId,
  author,
}: {
  projectId: number;
  author?: ProjectAuthor | null;
}) {
  const { data: session } = authClient.useSession();
  const {
    data = [],
    isError,
    refetch,
  } = useQuery({
    queryKey: [...queryKeys.projectMembers(projectId), session?.user.id ?? null],
    queryFn: async ({ signal }) =>
      (
        await API.get<{ data: ProjectMember[] }>(
          `/projects/${projectId}/members`,
          { signal },
        )
      ).data.data,
  });
  const people = [
    ...(author
      ? [{ ...author, userId: author.id, role: "Responsável pelo projeto" }]
      : []),
    ...data.filter(
      (member) => member.status === "accepted" && member.userId !== author?.id,
    ),
  ];
  if (!people.length && !isError) return null;
  return (
    <section
      aria-labelledby="project-team-title"
      className="space-y-3 border-t pt-5"
    >
      <h2 id="project-team-title" className="text-lg font-semibold">
        Equipa do projeto
      </h2>
      <ul className="flex flex-wrap gap-x-6 gap-y-4">
        {people.map((person) => {
          const content = (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-sm font-semibold">
                {person.image ? (
                  <img
                    src={person.image}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  person.name.slice(0, 1).toUpperCase()
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{person.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {person.role || "Membro da equipa"}
                </span>
              </span>
            </>
          );
          return (
            <li key={person.userId}>
              {person.handle ? (
                <Link
                  to="/profiles/$handle"
                  params={{ handle: person.handle }}
                  className="flex min-h-11 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-ring hover:text-primary"
                >
                  {content}
                </Link>
              ) : (
                <span className="flex items-center gap-3">{content}</span>
              )}
            </li>
          );
        })}
      </ul>
      {isError && (
        <p className="text-xs text-muted-foreground">
          Não foi possível carregar todos os membros da equipa.{" "}
          <button
            type="button"
            onClick={() => void refetch()}
            className="underline"
          >
            Tentar novamente
          </button>
        </p>
      )}
    </section>
  );
}
