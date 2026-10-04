import { Badge, Paper, Stack, Text } from "@mantine/core";
import { IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-react";
import { ReactNode } from "react";
import { Delta, formatCount } from "../../utils/format";

type StatCardProps = {
  label: string;
  icon: ReactNode;
  value: number;
  delta: Delta;
};

export function StatCard({ label, icon, value, delta }: StatCardProps) {
  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap={6}>
        <Text size="sm" c="dimmed" style={{ display: "flex", gap: 6 }}>
          {icon}
          {label}
        </Text>
        <Text fz={28} fw={700} lh={1}>
          {formatCount(value)}
        </Text>
        <DeltaBadge delta={delta} />
      </Stack>
    </Paper>
  );
}

function DeltaBadge({ delta }: { delta: Delta }) {
  // Keeps the card height stable when there is nothing to compare against.
  if (delta.kind === "none") {
    return (
      <Text size="xs" c="dimmed">
        Sem dados anteriores
      </Text>
    );
  }

  if (delta.kind === "new") {
    return (
      <Badge variant="light" color="teal" w="fit-content">
        Novo
      </Badge>
    );
  }

  const up = delta.percent >= 0;

  return (
    <Badge
      variant="light"
      color={up ? "teal" : "red"}
      w="fit-content"
      leftSection={
        up ? <IconArrowUpRight size={12} /> : <IconArrowDownRight size={12} />
      }
    >
      {up ? "+" : ""}
      {delta.percent}%
    </Badge>
  );
}
