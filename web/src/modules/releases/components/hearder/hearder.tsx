import { Button, Flex, Title } from "@mantine/core";
import { IconRocket } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";

type HearderProps = {};

export function Hearder({}: HearderProps) {
  const navigate = useNavigate();

  function handelGoToSubmit() {
    navigate({ to: "/dashboard/submit" });
  }

  return (
    <Flex align={"center"} justify={"space-between"}>
      <Title order={3}>Lançamentos</Title>
      <Button
        variant="default"
        leftSection={<IconRocket size={18} />}
        onClick={handelGoToSubmit}
      >
        Publicar Projeto
      </Button>
    </Flex>
  );
}
