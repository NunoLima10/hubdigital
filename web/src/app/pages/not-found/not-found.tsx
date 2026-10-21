import { Button, Center, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <Center mih="100vh">
      <title>Página não encontrada · HubDigital Cabo Verde</title>
      <Stack align="center" gap="xs">
        <Title order={1}>404</Title>
        <Text c="dimmed">Esta página não existe.</Text>
        <Button component={Link} to="/" variant="default">
          Voltar ao início
        </Button>
      </Stack>
    </Center>
  );
}
