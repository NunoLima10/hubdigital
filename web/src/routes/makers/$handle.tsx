import { Header } from "@/components/header/header";
import { Page } from "@/layouts/page";
import { pricingLabels } from "@/modules/submit/options";
import { Projectcard } from "@/modules/project-list/components/project-card/project-card";
import { useMaker } from "@/modules/makers/hooks/use-maker";
import {
  Anchor,
  Avatar,
  Container,
  Divider,
  Flex,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconWorld,
} from "@tabler/icons-react";
import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/makers/$handle")({
  component: RouteComponent,
});

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <Stack gap={0} align="center">
      <Text fw={700} fz="lg" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </Text>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </Stack>
  );
}

function RouteComponent() {
  const { handle } = Route.useParams();
  const { data, isLoading, isError } = useMaker(handle);

  return (
    <Page>
      <Header />
      <Container size={900} w={"100%"} py={"xl"}>
        {isLoading && (
          <Stack gap="lg">
            <Skeleton h={72} circle />
            <Skeleton h={24} w={240} />
            <Skeleton h={180} radius="md" />
          </Stack>
        )}

        {isError && (
          <Stack align="center" py="xl">
            <Text c="dimmed">Não encontrámos este perfil.</Text>
            <Anchor component={Link} to="/">
              Voltar aos lançamentos
            </Anchor>
          </Stack>
        )}

        {data && (
          <Stack gap="lg">
            <Flex gap="lg" align="flex-start" wrap="wrap">
              <Avatar src={data.image ?? undefined} size={72} radius="xl">
                {data.name.slice(0, 2).toUpperCase()}
              </Avatar>

              <Stack gap={6} style={{ flex: 1, minWidth: 240 }}>
                <Title order={2}>{data.name}</Title>
                {data.handle && (
                  <Text size="sm" c="dimmed">
                    @{data.handle}
                  </Text>
                )}
                <Text size="sm">{data.bio}</Text>

                <Group gap="sm" mt={4}>
                  {data.websiteUrl && (
                    <Anchor
                      href={data.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      size="sm"
                    >
                      <Group gap={4}>
                        <IconWorld size={16} />
                        Website
                      </Group>
                    </Anchor>
                  )}
                  {data.githubUrl && (
                    <Anchor
                      href={data.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      size="sm"
                    >
                      <Group gap={4}>
                        <IconBrandGithub size={16} />
                        GitHub
                      </Group>
                    </Anchor>
                  )}
                  {data.linkedinUrl && (
                    <Anchor
                      href={data.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      size="sm"
                    >
                      <Group gap={4}>
                        <IconBrandLinkedin size={16} />
                        LinkedIn
                      </Group>
                    </Anchor>
                  )}
                </Group>
              </Stack>

              <Group gap="xl">
                <Stat value={data.projectCount} label="Projetos" />
                <Stat value={data.totalUpvotes} label="Votos recebidos" />
              </Group>
            </Flex>

            <Divider />

            <Title order={4}>Lançamentos</Title>

            {data.projects.length === 0 ? (
              <Text c="dimmed" size="sm">
                Ainda não publicou nenhum projeto.
              </Text>
            ) : (
              <Stack gap={40}>
                {data.projects.map((project) => (
                  <Projectcard
                    key={project.id}
                    id={project.id}
                    slug={project.slug}
                    title={project.name}
                    description={project.shortDescription}
                    website={project.websiteUrl}
                    iconUrl={project.logoUrl ?? undefined}
                    topis={
                      [
                        project.category?.name,
                        pricingLabels[project.pricing],
                      ].filter(Boolean) as string[]
                    }
                    upCount={project.upvoteCount}
                    hasUpvoted={project.hasUpvoted}
                    commentCount={project.commentCount}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Container>
    </Page>
  );
}
