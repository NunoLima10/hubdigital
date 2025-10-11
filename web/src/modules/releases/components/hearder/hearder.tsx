import { Button, Flex, Title } from "@mantine/core";
import { IconRocket } from "@tabler/icons-react";

type HearderProps = {};

export function Hearder({}: HearderProps) {
  return (
    <Flex align={"center"} justify={"space-between"}>
      <Title order={3}>Lançamentos</Title>
      <Button variant="default" leftSection={<IconRocket size={18} />}>
        Publicar Projeto
      </Button>
    </Flex>
  );
}
