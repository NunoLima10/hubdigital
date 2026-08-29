import { Header } from "@/components/header/header";
import { Page } from "@/layouts/page";
import { useProject } from "@/modules/project-detail/hooks/use-project";
import { ProjectDetailView } from "@/modules/project-detail/components/project-detail-view/project-detail-view";
import { Anchor, Container, Skeleton, Stack, Text } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$slug")({
  component: RouteComponent,
});

function RouteComponent() {
  const { slug } = Route.useParams();
  const { data, isLoading, isError } = useProject(slug);

  return (
    <Page>
      <Header />
      <Container size={900} w={"100%"} py={"xl"}>
        <Stack gap={"lg"}>
          <Anchor component={Link} to="/" size="sm" c="dimmed">
            <IconArrowLeft
              size={14}
              style={{ verticalAlign: "middle", marginRight: 4 }}
            />
            Voltar
          </Anchor>

          {isLoading && (
            <Stack gap="lg">
              <Skeleton h={32} w={280} />
              <Skeleton h={280} radius="md" />
            </Stack>
          )}

          {isError && (
            <Text c="dimmed">Não foi possível carregar este projeto.</Text>
          )}

          {data && <ProjectDetailView project={data} />}
        </Stack>
      </Container>
      {/* <Footer /> */}
    </Page>
  );
}
