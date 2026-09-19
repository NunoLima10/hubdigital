import { Header } from "@/components/header/header";
import { Page } from "@/layouts/page";
import { ProjectList } from "@/modules/project-list";
import { Anchor, Container, Stack, Text, Title } from "@mantine/core";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rankings/$week")({
  component: RouteComponent,
});

/** `2026-W35` reads better to a person as "semana 35 de 2026". */
function describeWeek(week: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(week);
  if (!match) return week;

  return `Semana ${Number(match[2])} de ${match[1]}`;
}

function RouteComponent() {
  const { week } = Route.useParams();

  return (
    <Page>
      <Header />
      <Stack mt={100}>
        <Title ta={"center"} order={1}>
          {describeWeek(week)}
        </Title>
        <Container p={0} size={600}>
          <Text ta={"center"} size="md" c="dimmed">
            O ranking desta semana já está fechado. Vê o que a comunidade
            lançou e votou.
          </Text>
        </Container>
        <Anchor component={Link} to="/" ta="center" mb="md">
          Ver os lançamentos desta semana
        </Anchor>

        <ProjectList week={week} />
      </Stack>
    </Page>
  );
}
