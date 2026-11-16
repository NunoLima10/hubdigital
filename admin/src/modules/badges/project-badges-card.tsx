import { grantProjectBadge, revokeProjectBadge } from "@/api/admin";
import { relativeTime } from "@/utils/relative-time";
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  manualProjectBadgeKeys,
  projectBadgeCatalog,
  type AdminProjectBadgeAward,
  type GrantProjectBadgeBody,
  type ProjectBadgeKey,
} from "@hubdigital/shared";
import { notifications } from "@mantine/notifications";
import { IconAward, IconTrash, IconX } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useState } from "react";

const colors: Record<ProjectBadgeKey, string> = {
  "weekly-top-1": "yellow",
  "weekly-top-3": "gray",
  "weekly-top-10": "orange",
  "upvotes-10": "blue",
  "upvotes-50": "blue",
  "upvotes-100": "indigo",
  "upvotes-500": "grape",
  "staff-pick": "teal",
  "project-of-month": "blue",
  pioneer: "dark",
};

const months = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function periodLabel(award: AdminProjectBadgeAward) {
  if (award.key === "pioneer" && award.rank) return `#${award.rank}`;
  if (!award.period) return null;
  const week = /^(\d{4})-W(\d{2})$/.exec(award.period);
  if (week) return `${award.rank ?? "?"}º · semana ${Number(week[2])} de ${week[1]}`;
  const month = /^(\d{4})-(\d{2})$/.exec(award.period);
  if (month) return `${months[Number(month[2]) - 1]} ${month[1]}`;
  return award.period;
}

function currentMonth() {
  // Cabo Verde time (UTC-1), like the rest of the platform's calendar.
  return new Date(Date.now() - 60 * 60 * 1000).toISOString().slice(0, 7);
}

function showError(error: unknown, fallback: string) {
  const message = isAxiosError(error) ? error.response?.data?.message : null;
  notifications.show({
    title: "Algo correu mal!",
    message: typeof message === "string" && message ? message : fallback,
    icon: <IconX />,
    color: "red",
  });
}

/**
 * A project's achievements. Weekly plaques, upvote milestones and pioneer
 * follow their rule and are read-only; staff grant and revoke the manual ones
 * (staff pick, project of the month).
 */
export function ProjectBadgesCard({
  projectId,
  badges,
  queryKey,
}: {
  projectId: number;
  badges: AdminProjectBadgeAward[];
  queryKey: unknown[];
}) {
  const [selected, setSelected] = useState<ProjectBadgeKey | null>(null);
  const [month, setMonth] = useState(currentMonth);
  const held = new Set(badges.map((badge) => badge.key));
  // Repeatable badges (one per month) can always be granted again.
  const grantable = manualProjectBadgeKeys.filter(
    (key) => projectBadgeCatalog[key].period !== null || !held.has(key)
  );
  const needsMonth = selected ? projectBadgeCatalog[selected].period === "month" : false;

  const grant = useMutation({
    mutationFn: (body: GrantProjectBadgeBody) => grantProjectBadge(projectId, body),
    meta: {
      invalidatesQuery: queryKey,
      successMessage: "Conquista atribuída. Já aparece na página do projeto.",
    },
    onError: (error) => showError(error, "Não foi possível atribuir a conquista."),
    onSuccess: () => setSelected(null),
  });

  const revoke = useMutation({
    mutationFn: (awardId: number) => revokeProjectBadge(projectId, awardId),
    meta: {
      invalidatesQuery: queryKey,
      successMessage: "Conquista removida.",
    },
    onError: (error) => showError(error, "Não foi possível remover a conquista."),
  });

  return (
    <Card withBorder padding="lg">
      <Stack gap="sm">
        <Title order={5}>Conquistas</Title>

        {badges.length === 0 ? (
          <Text size="sm" c="dimmed">
            Ainda não tem conquistas.
          </Text>
        ) : (
          <Stack gap="xs">
            {badges.map((award) => {
              const badge = projectBadgeCatalog[award.key];
              const manual = badge.awardMode === "manual";
              const period = periodLabel(award);
              return (
                <Group key={award.id} justify="space-between" wrap="nowrap">
                  <Stack gap={2}>
                    <Group gap="xs" wrap="nowrap">
                      <Badge variant="light" color={colors[award.key]}>
                        {badge.name}
                      </Badge>
                      {period && (
                        <Text size="xs" fw={500}>
                          {period}
                        </Text>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed">
                      {manual
                        ? `Atribuída${award.awardedBy ? ` por ${award.awardedBy.name}` : ""}`
                        : "Automática"}{" "}
                      · {relativeTime(award.awardedAt)}
                    </Text>
                  </Stack>
                  {manual && (
                    <Tooltip label="Remover conquista">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label={`Remover ${badge.name}`}
                        loading={revoke.isPending && revoke.variables === award.id}
                        onClick={() => revoke.mutate(award.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              );
            })}
          </Stack>
        )}

        {grantable.length > 0 && (
          <Stack gap="xs">
            <Group gap="xs" align="flex-end" wrap="nowrap">
              <Select
                label="Atribuir conquista"
                placeholder="Escolhe uma conquista"
                data={grantable.map((key) => ({
                  value: key,
                  label: projectBadgeCatalog[key].name,
                }))}
                value={selected}
                onChange={(value) => setSelected(value as ProjectBadgeKey | null)}
                style={{ flex: 1 }}
              />
              {needsMonth && (
                <TextInput
                  label="Mês"
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.currentTarget.value)}
                  w={150}
                />
              )}
              <Button
                leftSection={<IconAward size={16} />}
                disabled={!selected || (needsMonth && !month)}
                loading={grant.isPending}
                onClick={() =>
                  selected &&
                  grant.mutate(needsMonth ? { key: selected, period: month } : { key: selected })
                }
              >
                Atribuir
              </Button>
            </Group>
            {selected && (
              <Text size="xs" c="dimmed">
                {projectBadgeCatalog[selected].description}
                {needsMonth && " Só um projeto pode ser o projeto de cada mês."}
              </Text>
            )}
          </Stack>
        )}

        <Text size="xs" c="dimmed">
          Rankings semanais, apoios e pioneiro são atribuídos automaticamente.
        </Text>
      </Stack>
    </Card>
  );
}
