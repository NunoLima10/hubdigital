import {
  ActionIcon,
  Avatar,
  Flex,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconLink, IconPencil, IconRocket } from "@tabler/icons-react";

type ReleasesItemProps = {};

export function ReleasesItem({}: ReleasesItemProps) {
  return (
    <Paper withBorder p="lg" radius="md">
      <Stack justify="space-between" h={"100%"}>
        <Stack gap={"xxs"}>
          <Flex>
            <Avatar>
              <IconRocket size={18} />
            </Avatar>
            <Flex w={"100%"} justify={"end"} gap={"xxs"}>
              <ActionIcon variant="default" size={"lg"}>
                <IconLink size={18} />
              </ActionIcon>
              <ActionIcon variant="default" size={"lg"}>
                <IconPencil size={18} />
              </ActionIcon>
            </Flex>
          </Flex>
          <Title order={4} lineClamp={1}>
            Notifika
          </Title>
          <Text size="sm" lineClamp={2} c={"dimmed"}>
            Alguam descrição simpleficado sobre o que é o projeto e mais aalguma
          </Text>
        </Stack>
      </Stack>
    </Paper>
  );
}
