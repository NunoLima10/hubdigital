import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";

/** Shown with a 404 status, so search engines also learn the page is gone. */
export function NotFound() {
  return (
    <Container size={480} py={120}>
      <Stack align="center" gap="md">
        <Title order={1} ta="center">
          Página não encontrada
        </Title>
        <Text c="dimmed" ta="center">
          O endereço que abriste não existe ou já foi removido.
        </Text>
        <Button component={Link} to="/">
          Voltar ao início
        </Button>
      </Stack>
    </Container>
  );
}
