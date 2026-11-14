import { Link } from "@tanstack/react-router";
import { Inbox, Send } from "lucide-react";
import type { ProjectMemberStatus } from "@hubdigital/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useReceivedInvitations,
  useReplyToInvitation,
  useSentInvitationActions,
  useSentInvitations,
} from "../hooks/use-invitations";
import { PersonAvatar } from "./person-avatar";

const dateFormat = new Intl.DateTimeFormat("pt-PT", {
  day: "numeric",
  month: "short",
});

const statusLabels: Record<ProjectMemberStatus, string> = {
  pending: "À espera de resposta",
  accepted: "Aceite",
  declined: "Recusado",
};
const statusStyles: Record<ProjectMemberStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  accepted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  declined: "bg-muted text-muted-foreground",
};

function ProjectLink({ name, slug }: { name: string; slug: string }) {
  return (
    <Link
      to="/projects/$slug"
      params={{ slug }}
      className="font-medium hover:text-primary hover:underline"
    >
      {name}
    </Link>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function LoadError({ retry }: { retry: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <p>Não foi possível carregar os convites.</p>
      <Button type="button" variant="ghost" size="sm" onClick={retry}>
        Tentar novamente
      </Button>
    </div>
  );
}

function ReceivedInvitations() {
  const { data = [], isLoading, isError, refetch } = useReceivedInvitations();
  const reply = useReplyToInvitation();
  return (
    <section aria-labelledby="received-title" className="space-y-3">
      <div className="flex items-center gap-2">
        <Inbox className="size-4 text-primary" aria-hidden="true" />
        <h2 id="received-title" className="font-semibold">
          Convites recebidos
        </h2>
        {data.length > 0 && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            {data.length}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Quando aceitas, apareces na equipa do projeto e o projeto aparece no
        teu perfil.
      </p>
      {isLoading && (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      )}
      {isError && <LoadError retry={() => void refetch()} />}
      {!isLoading && !isError && !data.length && (
        <EmptyState>Não tens convites por responder.</EmptyState>
      )}
      <ul className="space-y-2">
        {data.map((invitation) => (
          <li
            key={invitation.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4"
          >
            <PersonAvatar
              name={invitation.project.name}
              image={invitation.project.logoUrl}
              className="size-11 rounded-lg"
            />
            <div className="min-w-0 flex-1 text-sm">
              <p>
                {invitation.invitedBy ? (
                  <span className="font-medium">
                    {invitation.invitedBy.name}
                  </span>
                ) : (
                  "Alguém"
                )}{" "}
                convidou-te para a equipa de{" "}
                <ProjectLink
                  name={invitation.project.name}
                  slug={invitation.project.slug}
                />
              </p>
              <p className="text-xs text-muted-foreground">
                {invitation.role ? `${invitation.role} · ` : ""}
                {dateFormat.format(new Date(invitation.createdAt))}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={reply.isPending}
                onClick={() =>
                  reply.mutate({ id: invitation.id, accept: true })
                }
              >
                Aceitar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={reply.isPending}
                onClick={() =>
                  reply.mutate({ id: invitation.id, accept: false })
                }
              >
                Recusar
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {reply.isError && (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível responder. Tenta novamente.
        </p>
      )}
    </section>
  );
}

function SentInvitations() {
  const { data = [], isLoading, isError, refetch } = useSentInvitations();
  const action = useSentInvitationActions();
  return (
    <section aria-labelledby="sent-title" className="space-y-3 border-t pt-6">
      <div className="flex items-center gap-2">
        <Send className="size-4 text-primary" aria-hidden="true" />
        <h2 id="sent-title" className="font-semibold">
          Convites enviados
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Pessoas que convidaste para as equipas dos teus projetos. Convidas
        novas pessoas no passo Comunidade de cada projeto.
      </p>
      {isLoading && (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      )}
      {isError && <LoadError retry={() => void refetch()} />}
      {!isLoading && !isError && !data.length && (
        <EmptyState>Ainda não convidaste ninguém.</EmptyState>
      )}
      <ul className="space-y-2">
        {data.map((invitation) => (
          <li
            key={invitation.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
          >
            <PersonAvatar
              name={invitation.invitee.name}
              image={invitation.invitee.image}
            />
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate">
                <span className="font-medium">{invitation.invitee.name}</span>
                {invitation.invitee.handle && (
                  <span className="text-muted-foreground">
                    {" "}
                    @{invitation.invitee.handle}
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                <ProjectLink
                  name={invitation.project.name}
                  slug={invitation.project.slug}
                />
                {invitation.role ? ` · ${invitation.role}` : ""}
                {" · "}
                {dateFormat.format(new Date(invitation.createdAt))}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                statusStyles[invitation.status],
              )}
            >
              {statusLabels[invitation.status]}
            </span>
            {invitation.status === "declined" && invitation.invitee.handle && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={action.isPending}
                onClick={() =>
                  action.mutate({
                    type: "reinvite",
                    projectId: invitation.project.id,
                    handle: invitation.invitee.handle!,
                    role: invitation.role,
                  })
                }
              >
                Convidar de novo
              </Button>
            )}
            {invitation.status !== "accepted" && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={action.isPending}
                onClick={() =>
                  action.mutate({
                    type: "cancel",
                    projectId: invitation.project.id,
                    id: invitation.id,
                  })
                }
              >
                {invitation.status === "pending" ? "Cancelar" : "Remover"}
              </Button>
            )}
          </li>
        ))}
      </ul>
      {action.isError && (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível atualizar o convite. Tenta novamente.
        </p>
      )}
    </section>
  );
}

export function CommunityView() {
  return (
    <div className="space-y-6">
      <ReceivedInvitations />
      <SentInvitations />
    </div>
  );
}
