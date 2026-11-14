import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { API } from "@/api/api";
import { authClient } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";
import type { MakerMembership, ProjectAuthor } from "@hubdigital/shared";

export function ProjectMakers({
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
    queryKey: [...queryKeys.projectMakers(projectId), session?.user.id ?? null],
    queryFn: async ({ signal }) =>
      (
        await API.get<{ data: MakerMembership[] }>(
          `/projects/${projectId}/makers`,
          { signal },
        )
      ).data.data,
  });
  const people = [
    ...(author
      ? [{ ...author, userId: author.id, role: "Responsável pelo projeto" }]
      : []),
    ...data.filter(
      (maker) => maker.status === "accepted" && maker.userId !== author?.id,
    ),
  ];
  if (!people.length && !isError) return null;
  return (
    <section
      aria-labelledby="project-makers-title"
      className="space-y-3 border-t pt-5"
    >
      <h2 id="project-makers-title" className="text-lg font-semibold">
        Criadores e colaboradores
      </h2>
      <ul className="flex flex-wrap gap-x-6 gap-y-4">
        {people.map((maker) => {
          const content = (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-sm font-semibold">
                {maker.image ? (
                  <img
                    src={maker.image}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  maker.name.slice(0, 1).toUpperCase()
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{maker.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {maker.role || "Colaborador"}
                </span>
              </span>
            </>
          );
          return (
            <li key={maker.userId}>
              {maker.handle ? (
                <Link
                  to="/makers/$handle"
                  params={{ handle: maker.handle }}
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
          Não foi possível carregar todos os colaboradores.{" "}
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
