import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/lib/query-keys";
import type { MakerMembership } from "@hubdigital/shared";
import { authClient } from "@/lib/auth-client";

type MakerResult = Pick<
  MakerMembership,
  "userId" | "name" | "handle" | "image"
>;

function CollaboratorAvatar({ name, image }: Pick<MakerResult, "name" | "image">) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase();

  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-xs font-medium text-muted-foreground"
    >
      {image && image !== failedImage ? (
        <img
          src={image}
          alt=""
          className="size-full object-cover"
          onError={() => setFailedImage(image)}
        />
      ) : (
        initials
      )}
    </span>
  );
}

export function ProjectCollaborators({
  projectId: savedProjectId,
  saveDraft,
  isSaving = false,
  canSave = false,
}: {
  projectId: number | null;
  saveDraft?: () => void;
  isSaving?: boolean;
  canSave?: boolean;
}) {
  const { data: session } = authClient.useSession();
  const cache = useQueryClient();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [settled, setSettled] = useState("");
  const [role, setRole] = useState("Programador");
  useEffect(() => {
    const timer = setTimeout(() => setSettled(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const members = useQuery({
    queryKey: [
      ...queryKeys.projectMakers(savedProjectId ?? undefined),
      session?.user.id ?? null,
    ],
    enabled: Boolean(savedProjectId),
    queryFn: async ({ signal }) =>
      (
        await API.get<{ data: MakerMembership[] }>(
          `/projects/${savedProjectId}/makers`,
          { signal },
        )
      ).data.data,
  });
  const search = useQuery({
    queryKey: ["maker-search", savedProjectId, settled],
    enabled:
      open &&
      Boolean(savedProjectId) &&
      settled.length >= 2 &&
      query.trim() === settled,
    queryFn: async ({ signal }) =>
      (
        await API.get<{ data: MakerResult[] }>(
          `/projects/${savedProjectId}/makers/search`,
          { params: { q: settled }, signal },
        )
      ).data.data,
  });
  const change = useMutation({
    mutationFn: async (
      action:
        | { type: "invite"; handle: string; role: string }
        | { type: "role"; id: number; role: string }
        | { type: "remove"; id: number },
    ) => {
      const base = `/projects/${savedProjectId}/makers`;
      if (action.type === "invite")
        await API.post(base, { handle: action.handle, role: action.role });
      else if (action.type === "role")
        await API.patch(`${base}/${action.id}`, { role: action.role });
      else await API.delete(`${base}/${action.id}`);
    },
    onSuccess: async () => {
      await Promise.all([
        cache.invalidateQueries({
          queryKey: queryKeys.projectMakers(savedProjectId ?? undefined),
        }),
        cache.invalidateQueries({ queryKey: queryKeys.makers }),
        cache.invalidateQueries({ queryKey: ["maker-invitations"] }),
      ]);
    },
  });
  const results = (query.trim() === settled ? (search.data ?? []) : []).filter(
    (maker) => !members.data?.some((member) => member.userId === maker.userId),
  );
  const error = change.isError && (
    <p role="alert" className="text-sm text-destructive">
      Não foi possível atualizar os colaboradores. Tenta novamente.
    </p>
  );
  return (
    <section
      className="space-y-3 rounded-lg border p-4"
      aria-labelledby="collaborators-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="collaborators-title" className="text-sm font-semibold">
          Colaboradores
        </h2>
        <Button
          type="button"
          variant="outline"
          disabled={!savedProjectId}
          onClick={() => {
            change.reset();
            setOpen(true);
          }}
        >
          Adicionar colaborador
        </Button>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Dá crédito a quem contribuiu. Cada pessoa aceita o convite antes de
        aparecer no projeto. Só tu podes gerir e publicar o projeto.
      </p>
      {!savedProjectId && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Guarda o rascunho para adicionar pessoas que já têm conta.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canSave || isSaving}
            onClick={saveDraft}
          >
            {isSaving ? "A guardar…" : "Guardar rascunho"}
          </Button>
        </div>
      )}
      {members.isError && (
        <div className="text-sm">
          <p>Não foi possível carregar os colaboradores.</p>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void members.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      )}
      {members.isLoading && savedProjectId && (
        <p className="text-xs text-muted-foreground">
          A carregar colaboradores…
        </p>
      )}
      <ul className="space-y-3">
        {members.data?.map((member) => (
          <li
            key={`${member.id}:${member.role}`}
            className="flex flex-wrap items-center gap-2 border-t pt-3"
          >
            <div className="flex min-w-0 flex-1 basis-full items-center gap-3 text-sm sm:basis-auto">
              <CollaboratorAvatar name={member.name} image={member.image} />
              <div className="min-w-0">
                <p className="truncate font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                  {member.status === "accepted"
                    ? "Convite aceite"
                    : "À espera de aceitação"}
                </p>
              </div>
            </div>
            <Input
              aria-label={`Contribuição de ${member.name}`}
              className="w-40"
              maxLength={80}
              defaultValue={member.role ?? ""}
              disabled={change.isPending}
              onBlur={(event) => {
                const next = event.target.value.trim();
                if (next.length >= 2 && next !== member.role)
                  change.mutate({ type: "role", id: member.id, role: next });
                else event.target.value = member.role ?? "";
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={change.isPending}
              onClick={() => change.mutate({ type: "remove", id: member.id })}
            >
              Remover
            </Button>
          </li>
        ))}
      </ul>
      {error}
      {open && (
        <Dialog
          open
          title="Adicionar colaborador"
          onClose={() => setOpen(false)}
        >
          <div className="space-y-4">
            <label className="block space-y-1.5 text-sm">
              Contribuição
              <Input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                maxLength={80}
                list="contribution-roles"
              />
              <datalist id="contribution-roles">
                {[
                  "Programador",
                  "Designer",
                  "Cofundador",
                  "Marketing",
                  "Gestão de produto",
                ].map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </label>
            <label className="block space-y-1.5 text-sm">
              Procurar por nome ou utilizador
              <Input
                value={query}
                maxLength={80}
                placeholder="Pelo menos 2 caracteres"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            {search.isFetching && (
              <p role="status" className="text-sm text-muted-foreground">
                A procurar…
              </p>
            )}
            {search.isError && (
              <p role="alert" className="text-sm text-destructive">
                Não foi possível procurar.{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => void search.refetch()}
                >
                  Tentar novamente
                </button>
              </p>
            )}
            {!search.isFetching &&
              search.isSuccess &&
              settled.length >= 2 &&
              !results.length && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma pessoa disponível com esse nome. Experimenta o nome de
                  utilizador.
                </p>
              )}
            <ul className="space-y-2">
              {results.map((maker) => (
                <li
                  key={maker.userId}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  <CollaboratorAvatar name={maker.name} image={maker.image} />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="truncate font-medium">{maker.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      @{maker.handle}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      change.isPending ||
                      role.trim().length < 2 ||
                      !maker.handle
                    }
                    onClick={() =>
                      change.mutate({
                        type: "invite",
                        handle: maker.handle!,
                        role: role.trim(),
                      })
                    }
                  >
                    Convidar
                  </Button>
                </li>
              ))}
            </ul>
            {error}
          </div>
        </Dialog>
      )}
    </section>
  );
}
