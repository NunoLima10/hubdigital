import { grantBadge, revokeBadge } from "@/api/admin";
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
  Title,
  Tooltip,
} from "@mantine/core";
import {
  badgeCatalog,
  manualBadgeKeys,
  type AwardedBadge,
  type BadgeKey,
} from "@hubdigital/shared";
import { IconAward, IconTrash } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

const colors: Record<BadgeKey, string> = {
  founder: "blue",
  maintainer: "teal",
  "founding-gold": "yellow",
  "founding-silver": "gray",
  "founding-basalt": "dark",
};

/**
 * The badges an account holds. Staff grant and revoke the manual ones (founder,
 * maintainer); founding-member badges follow the join order and are read-only.
 */
export function UserBadgesCard({
  userId,
  badges,
  queryKey,
}: {
  userId: string;
  badges: AwardedBadge[];
  queryKey: unknown[];
}) {
  const [selected, setSelected] = useState<BadgeKey | null>(null);
  const held = new Set(badges.map((badge) => badge.key));
  const grantable = manualBadgeKeys.filter((key) => !held.has(key));

  const grant = useMutation({
    mutationFn: (key: BadgeKey) => grantBadge(userId, key),
    meta: {
      invalidatesQuery: queryKey,
      successMessage: "Distintivo atribuído. A pessoa vê-o na próxima visita.",
      errorMessage: "Não foi possível atribuir o distintivo.",
    },
    onSuccess: () => setSelected(null),
  });

  const revoke = useMutation({
    mutationFn: (key: BadgeKey) => revokeBadge(userId, key),
    meta: {
      invalidatesQuery: queryKey,
      successMessage: "Distintivo removido.",
      errorMessage: "Não foi possível remover o distintivo.",
    },
  });

  return (
    <Card withBorder padding="lg">
      <Stack gap="sm">
        <Title order={5}>Distintivos</Title>

        {badges.length === 0 ? (
          <Text size="sm" c="dimmed">
            Ainda não tem distintivos.
          </Text>
        ) : (
          <Stack gap="xs">
            {badges.map((awarded) => {
              const badge = badgeCatalog[awarded.key];
              const manual = badge.awardMode === "manual";
              return (
                <Group key={awarded.key} justify="space-between" wrap="nowrap">
                  <Group gap="xs" wrap="nowrap">
                    <Badge variant="light" color={colors[awarded.key]}>
                      {badge.name}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {manual ? "Atribuído" : "Automático"} ·{" "}
                      {relativeTime(awarded.awardedAt)}
                    </Text>
                  </Group>
                  {manual && (
                    <Tooltip label="Remover distintivo">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label={`Remover ${badge.name}`}
                        loading={revoke.isPending && revoke.variables === awarded.key}
                        onClick={() => revoke.mutate(awarded.key)}
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
          <Group gap="xs" align="flex-end" wrap="nowrap">
            <Select
              label="Atribuir distintivo"
              placeholder="Escolhe um distintivo"
              data={grantable.map((key) => ({
                value: key,
                label: `${badgeCatalog[key].name} · ${badgeCatalog[key].material}`,
              }))}
              value={selected}
              onChange={(value) => setSelected(value as BadgeKey | null)}
              style={{ flex: 1 }}
            />
            <Button
              leftSection={<IconAward size={16} />}
              disabled={!selected}
              loading={grant.isPending}
              onClick={() => selected && grant.mutate(selected)}
            >
              Atribuir
            </Button>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
