import { UserButton } from "@/components/user-button/user-button";
import { Group, Stack, Text } from "@mantine/core";

export function Profile() {
  return (
    <Group>
      <UserButton />
      <Stack gap="none">
        <Text fw={"600"}>Nome do user</Text>
        <Text size="sm" c={"dimmed"}>
          Algo sobre user
        </Text>
      </Stack>
    </Group>
  );
}
