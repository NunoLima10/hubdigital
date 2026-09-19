import { relativeTime } from "@/utils/relative-time";
import type { AuditEntryView } from "@hubdigital/shared";
import { Stack, Text, Timeline } from "@mantine/core";

const actionLabels: Record<string, string> = {
  "project.approve": "Aprovou o projeto",
  "project.reject": "Rejeitou o projeto",
  "project.unpublish": "Despublicou o projeto",
  "project.restore": "Restaurou o projeto",
  "project.shadow_ban": "Ocultou o projeto",
  "project.unshadow_ban": "Reexpôs o projeto",
  "user.shadow_ban": "Ocultou a conta",
  "user.unshadow_ban": "Reexpôs a conta",
  "comment.hide": "Ocultou o comentário",
  "comment.unhide": "Reexpôs o comentário",
  "comment.delete": "Removeu o comentário",
  "publisher.trust": "Marcou como maker de confiança",
  "publisher.untrust": "Retirou a marca de confiança",
  "setting.update": "Alterou definições",
  "report.resolve": "Resolveu relatórios",
};

export function actionLabel(action: string) {
  return actionLabels[action] ?? action;
}

export function AuditHistory({ entries }: { entries: AuditEntryView[] }) {
  if (entries.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Ainda não há ações registadas.
      </Text>
    );
  }

  return (
    <Timeline bulletSize={12} lineWidth={1}>
      {entries.map((entry) => (
        <Timeline.Item key={entry.id}>
          <Stack gap={2}>
            <Text size="sm">{actionLabel(entry.action)}</Text>
            {entry.reason && (
              <Text size="sm" c="dimmed" fs="italic">
                «{entry.reason}»
              </Text>
            )}
            <Text size="xs" c="dimmed">
              {entry.actor.name} · {relativeTime(entry.createdAt)}
            </Text>
          </Stack>
        </Timeline.Item>
      ))}
    </Timeline>
  );
}
