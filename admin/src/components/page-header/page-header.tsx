import { Group, Stack, Text, Title } from "@mantine/core";
import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap" mb="lg">
      <Stack gap={2}>
        <Title order={3}>{title}</Title>
        {description && (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}
      </Stack>
      {action}
    </Group>
  );
}
