import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { API } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/lib/query-keys";
import type { ProjectMember, ProjectMemberStatus } from "@hubdigital/shared";
import { PersonAvatar } from "@/modules/invitations/components/person-avatar";
import { useInvalidateTeams } from "@/modules/invitations/hooks/use-invitations";
import type { TeamInvite } from "@/modules/submit/utils/draft";
import { authClient } from "@/lib/auth-client";
import { RolePicker } from "./role-picker";
import {
  Check,
  Clock,
  Pencil,
  MailCheck,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

type PersonResult = Pick<ProjectMember, "userId" | "name" | "handle" | "image">;


const statusText: Record<ProjectMemberStatus, string> = {
  pending: "À espera de resposta",
  accepted: "Faz parte da equipa",
  declined: "Recusou o convite",
};
const statusDot: Record<ProjectMemberStatus, string> = {
  pending: "bg-amber-500",
  accepted: "bg-emerald-500",
  declined: "bg-muted-foreground",
};

/** Shows a member's contribution and lets the owner change it in place. */
function RoleField({
  name,
  role,
  disabled,
  onSave,
}: {
  name: string;
  role: string;
  disabled?: boolean;
  onSave: (role: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(role);
  if (!editing)
    return (
      <div className="flex items-center gap-1.5">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {role || "Sem papel definido"}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={disabled}
          aria-label={`Mudar o papel de ${name}`}
          onClick={() => {
            setDraft(role);
            setEditing(true);
          }}
        >
          <Pencil className="size-3.5" />
          Mudar
        </Button>
      </div>
    );
  const valid = draft.trim().length >= 2;
  return (
    <div className="w-full space-y-3 rounded-md border bg-background p-3">
      <RolePicker
        value={draft}
        onChange={setDraft}
        label={`O que ${name} fez no projeto?`}
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setEditing(false)}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!valid || disabled}
          onClick={() => {
            if (draft.trim() !== role) onSave(draft.trim());
            setEditing(false);
          }}
        >
          Guardar
        </Button>
      </div>
    </div>
  );
}

/**
 * The project team. With `selection` (the submit flow) people are only picked
 * here and invited when the project is submitted, so no saved project is
 * needed. Without it, people are invited straight away.
 */
export function ProjectCollaborators({
  projectId,
  selection,
}: {
  projectId: number | null;
  selection?: {
    invites: TeamInvite[];
    onChange: (invites: TeamInvite[]) => void;
  };
}) {
  const { data: session } = authClient.useSession();
  const invalidateTeams = useInvalidateTeams();
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
      ...queryKeys.projectMembers(projectId ?? undefined),
      session?.user.id ?? null,
    ],
    enabled: Boolean(projectId),
    queryFn: async ({ signal }) =>
      (
        await API.get<{ data: ProjectMember[] }>(
          `/projects/${projectId}/members`,
          { signal },
        )
      ).data.data,
  });
  const search = useQuery({
    queryKey: ["member-search", settled],
    enabled: open && settled.length >= 2 && query.trim() === settled,
    queryFn: async ({ signal }) =>
      (
        await API.get<{ data: PersonResult[] }>("/members/search", {
          params: { q: settled },
          signal,
        })
      ).data.data,
  });
  const change = useMutation({
    mutationFn: async (
      action:
        | { type: "invite"; handle: string; role: string }
        | { type: "role"; id: number; role: string }
        | { type: "remove"; id: number },
    ) => {
      const base = `/projects/${projectId}/members`;
      if (action.type === "invite")
        await API.post(base, { handle: action.handle, role: action.role });
      else if (action.type === "role")
        await API.patch(`${base}/${action.id}`, { role: action.role });
      else await API.delete(`${base}/${action.id}`);
    },
    onSuccess: invalidateTeams,
  });
  const selected = selection?.invites ?? [];
  const isSelected = (userId: string) =>
    selected.some((invite) => invite.userId === userId);
  const results = (query.trim() === settled ? (search.data ?? []) : []).filter(
    (person) =>
      !members.data?.some((member) => member.userId === person.userId),
  );
  const canInviteNow = Boolean(projectId) && !selection;
  const isEmpty = !members.data?.length && !selected.length;
  const error = change.isError && (
    <p role="alert" className="text-sm text-destructive">
      Não foi possível atualizar a equipa. Tenta novamente.
    </p>
  );

  function pick(person: PersonResult) {
    if (!selection || !person.handle) return;
    if (isSelected(person.userId))
      selection.onChange(
        selected.filter((invite) => invite.userId !== person.userId),
      );
    else
      selection.onChange([
        ...selected,
        {
          userId: person.userId,
          handle: person.handle,
          name: person.name,
          image: person.image,
          role: role.trim(),
        },
      ]);
  }

  return (
    <section
      className="space-y-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5"
      aria-labelledby="collaborators-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
          >
            <Users className="size-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <h2 id="collaborators-title" className="text-base font-semibold">
              Equipa do projeto
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Ninguém constrói sozinho. Convida quem te ajudou a criar este
              projeto — aparecem no projeto e no perfil de cada um.
            </p>
          </div>
        </div>
        <Button
          type="button"
          disabled={!selection && !projectId}
          onClick={() => {
            change.reset();
            setOpen(true);
          }}
        >
          <UserPlus className="size-4" />
          Adicionar membro
        </Button>
      </div>
      <ul className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <li className="flex items-start gap-2 rounded-md bg-background/60 p-2.5">
          <Search className="mt-0.5 size-3.5 shrink-0 text-primary" />
          Procura colegas pelo nome ou utilizador.
        </li>
        <li className="flex items-start gap-2 rounded-md bg-background/60 p-2.5">
          <MailCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
          {selection
            ? "Os convites são enviados quando submeteres o projeto."
            : "A pessoa vê o convite na aba Comunidade e aceita antes de aparecer."}
        </li>
        <li className="flex items-start gap-2 rounded-md bg-background/60 p-2.5">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
          Só tu podes gerir e publicar o projeto.
        </li>
      </ul>
      {members.isError && (
        <div className="text-sm">
          <p>Não foi possível carregar a equipa.</p>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void members.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      )}
      {members.isLoading && projectId && (
        <p className="text-xs text-muted-foreground">A carregar equipa…</p>
      )}
      {isEmpty && !members.isLoading && (
        <p className="rounded-md border border-dashed bg-background/40 p-3 text-center text-xs text-muted-foreground">
          Ainda não adicionaste ninguém à equipa.
        </p>
      )}
      <ul className="space-y-2">
        {members.data?.map((member) => (
          <li
            key={`${member.id}:${member.role}`}
            className="flex flex-wrap items-center gap-2 rounded-lg border bg-background/70 p-3"
          >
            <div className="flex min-w-0 flex-1 basis-full items-center gap-3 text-sm sm:basis-auto">
              <PersonAvatar name={member.name} image={member.image} />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {member.name}
                  {member.handle && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      @{member.handle}
                    </span>
                  )}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${statusDot[member.status]}`}
                  />
                  {statusText[member.status]}
                </p>
              </div>
            </div>
            <RoleField
              name={member.name}
              role={member.role ?? ""}
              disabled={change.isPending}
              onSave={(next) =>
                change.mutate({ type: "role", id: member.id, role: next })
              }
            />
            {member.status === "declined" && member.handle && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={change.isPending}
                onClick={() =>
                  change.mutate({
                    type: "invite",
                    handle: member.handle!,
                    role: member.role ?? role.trim(),
                  })
                }
              >
                Convidar de novo
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={change.isPending}
              onClick={() => change.mutate({ type: "remove", id: member.id })}
            >
              {member.status === "pending" ? "Cancelar convite" : "Remover"}
            </Button>
          </li>
        ))}
        {selected.map((invite) => (
          <li
            key={invite.userId}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-background/70 p-3"
          >
            <div className="flex min-w-0 flex-1 basis-full items-center gap-3 text-sm sm:basis-auto">
              <PersonAvatar name={invite.name} image={invite.image} />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {invite.name}
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    @{invite.handle}
                  </span>
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3" aria-hidden="true" />
                  Convidado ao submeter o projeto
                </p>
              </div>
            </div>
            <RoleField
              name={invite.name}
              role={invite.role}
              onSave={(next) =>
                selection?.onChange(
                  selected.map((item) =>
                    item.userId === invite.userId
                      ? { ...item, role: next }
                      : item,
                  ),
                )
              }
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label={`Retirar ${invite.name} da equipa`}
              onClick={() =>
                selection?.onChange(
                  selected.filter((item) => item.userId !== invite.userId),
                )
              }
            >
              <X className="size-4" />
              Retirar
            </Button>
          </li>
        ))}
      </ul>
      {error}
      {open && (
        <Dialog
          open
          title="Adicionar membro da equipa"
          onClose={() => setOpen(false)}
        >
          <div className="space-y-4">
            <RolePicker value={role} onChange={setRole} />
            <label className="block space-y-1.5 text-sm font-medium">
              Quem queres adicionar?
              <Input
                value={query}
                maxLength={80}
                placeholder="Nome ou @utilizador (2+ letras)"
                autoFocus
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
              {results.map((person) => {
                const chosen = isSelected(person.userId);
                return (
                  <li
                    key={person.userId}
                    className="flex items-center gap-3 rounded-md border p-3"
                  >
                    <PersonAvatar name={person.name} image={person.image} />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="truncate font-medium">{person.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{person.handle}
                      </p>
                    </div>
                    {canInviteNow ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          change.isPending ||
                          role.trim().length < 2 ||
                          !person.handle
                        }
                        onClick={() =>
                          change.mutate({
                            type: "invite",
                            handle: person.handle!,
                            role: role.trim(),
                          })
                        }
                      >
                        Convidar
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant={chosen ? "outline" : "default"}
                        aria-pressed={chosen}
                        disabled={
                          !person.handle || (!chosen && role.trim().length < 2)
                        }
                        onClick={() => pick(person)}
                      >
                        {chosen && <Check className="size-4" />}
                        {chosen ? "Selecionado" : "Selecionar"}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
            {error}
            {selection && (
              <div className="flex justify-end">
                <Button type="button" onClick={() => setOpen(false)}>
                  Concluir
                </Button>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </section>
  );
}
