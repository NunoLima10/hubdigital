import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useReceivedInvitations } from "../hooks/use-invitations";

/** Points to the Comunidade tab while team invitations wait for an answer. */
export function InvitationsNotice() {
  const { data = [] } = useReceivedInvitations();
  if (!data.length) return null;
  return (
    <Link
      to="/dashboard/community"
      className="mb-6 flex w-full items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-left text-sm hover:border-primary/60"
    >
      <Users className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="flex-1">
        {data.length === 1
          ? "Tens 1 convite para uma equipa de projeto."
          : `Tens ${data.length} convites para equipas de projetos.`}
      </span>
      <span className="font-medium text-primary">Ver convites</span>
    </Link>
  );
}
