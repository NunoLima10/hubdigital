import type { AdminCommentState, ProjectStatus } from "@hubdigital/shared";
import { Badge, BadgeProps } from "@mantine/core";

const projectStatus: Record<ProjectStatus, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "gray" },
  pending: { label: "Em revisão", color: "yellow" },
  published: { label: "Publicado", color: "teal" },
  rejected: { label: "Rejeitado", color: "red" },
};

const commentState: Record<
  AdminCommentState,
  { label: string; color: string }
> = {
  visible: { label: "Visível", color: "teal" },
  hidden: { label: "Ocultado", color: "orange" },
  deleted: { label: "Removido", color: "red" },
};

export function ProjectStatusBadge({
  status,
  ...props
}: { status: ProjectStatus } & BadgeProps) {
  const meta = projectStatus[status];

  return (
    <Badge color={meta.color} variant="light" {...props}>
      {meta.label}
    </Badge>
  );
}

export function CommentStateBadge({
  state,
  ...props
}: { state: AdminCommentState } & BadgeProps) {
  const meta = commentState[state];

  return (
    <Badge color={meta.color} variant="light" {...props}>
      {meta.label}
    </Badge>
  );
}

/**
 * "Ocultado", never "shadow ban": the person it is applied to is told, so the
 * word in the interface has to be the honest one.
 */
export function HiddenBadge(props: BadgeProps) {
  return (
    <Badge color="orange" variant="light" {...props}>
      Ocultado
    </Badge>
  );
}

export function BannedBadge(props: BadgeProps) {
  return (
    <Badge color="red" variant="filled" {...props}>
      Banido
    </Badge>
  );
}

export function TrustedBadge(props: BadgeProps) {
  return (
    <Badge color="blue" variant="light" {...props}>
      Confiança
    </Badge>
  );
}
