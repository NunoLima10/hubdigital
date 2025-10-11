import { Footer } from "@/components/footer/footer";
import { Header } from "@/components/header/header";
import { Page } from "@/layouts/page";
import { ProjectList } from "@/modules/project-list";
import { Container, Stack, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Page>
      <Header/>
      <Stack mt={100}>
        <Title ta={"center"} order={1}>
          HubDigital Cabo Verde
        </Title>
        <Container p={0} size={600}>
          <Text ta={"center"} size="md" c="dimmed">
            Um Hub digital de código aberto para impulsionar a inovação em Cabo
            Verde, meio para descrobir partilhar e apoiar projetos e produtos
            criados em por caboverdianos para caboverdianos.
          </Text>
        </Container>
        <ProjectList />
      </Stack>
      <Footer />
    </Page>
  );
}
