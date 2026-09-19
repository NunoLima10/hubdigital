import { Project } from "@/modules/submit/types/project";
import { Alert, Text } from "@mantine/core";
import { IconAlertTriangle, IconEyeOff } from "@tabler/icons-react";

/**
 * What a maker is told about a moderation decision on their own project.
 *
 * A hide is deliberately not silent: the person it was applied to sees that it
 * happened and reads the reason (specs/ADMIN.md §A4). Only the owner ever gets
 * these fields — the API leaves them out for everyone else.
 */
export function ModerationNotice({ project }: { project: Project }) {
  if (project.hidden) {
    return (
      <Alert
        variant="light"
        color="orange"
        icon={<IconEyeOff size={18} />}
        title="Este projeto está oculto"
        p="xs"
      >
        <Text size="sm">
          Não aparece no site nem nos rankings. Motivo:{" "}
          <b>{project.hiddenReason ?? "não indicado"}</b>. Fale com a equipa se
          achar que houve um engano.
        </Text>
      </Alert>
    );
  }

  if (project.status === "rejected" && project.rejectionReason) {
    return (
      <Alert
        variant="light"
        color="red"
        icon={<IconAlertTriangle size={18} />}
        title="Precisa de alterações"
        p="xs"
      >
        <Text size="sm">
          {project.rejectionReason} Corrija e volte a publicar para entrar de
          novo na fila.
        </Text>
      </Alert>
    );
  }

  return null;
}
