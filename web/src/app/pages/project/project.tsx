import { Footer } from "@/components/footer/footer";
import { Header } from "@/components/header/header";
import { EDIT_DATA_URL, getProject } from "@/data";
import { ProjectIcon } from "@/features/project-list/components/project-icon/project-icon";
import { VoteButton } from "@/features/project-list/components/vote-button/vote-button";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconBrandGithub,
  IconExternalLink,
} from "@tabler/icons-react";
import { Link, useParams } from "react-router-dom";
import { NotFound } from "../not-found/not-found";
import classes from "../landing/landing.module.css";

export function ProjectPage() {
  const { slug } = useParams();
  const project = slug ? getProject(slug) : undefined;

  if (!project) return <NotFound />;

  const details = [
    { label: "Categoria", value: project.category },
    { label: "Ilha", value: project.island },
    { label: "Fundado em", value: project.foundedYear },
    { label: "No HubDigital desde", value: project.addedAt },
  ].filter((d) => d.value);

  return (
    <Container className={classes.container}>
      <title>{`${project.name} · HubDigital Cabo Verde`}</title>
      <Header />
      <Stack gap="lg">
        <Anchor component={Link} to="/" size="sm" c="dimmed">
          <Group gap={4}>
            <IconArrowLeft size={14} /> Todos os projetos
          </Group>
        </Anchor>

        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Group wrap="nowrap" align="flex-start">
            <ProjectIcon name={project.name} iconUrl={project.iconUrl} />
            <Stack gap={4}>
              <Title order={1} fz={28}>
                {project.name}
              </Title>
              <Text c="dimmed">{project.tagline}</Text>
            </Stack>
          </Group>
          <VoteButton slug={project.slug} upCount={project.upCount} />
        </Group>

        {project.status === "offline" && (
          <Alert color="gray" variant="light">
            Este site parece estar offline. Se o projeto continua ativo,{" "}
            <Anchor href={EDIT_DATA_URL} target="_blank">
              atualize a informação
            </Anchor>
            .
          </Alert>
        )}

        <Group gap="xs">
          <Button
            component="a"
            href={project.website}
            target="_blank"
            rel="noopener"
            rightSection={<IconExternalLink size={16} />}
          >
            Visitar site
          </Button>
          {project.github && (
            <Button
              component="a"
              href={project.github}
              target="_blank"
              rel="noopener"
              variant="default"
              leftSection={<IconBrandGithub size={16} />}
            >
              Código
            </Button>
          )}
        </Group>

        {project.description && <Text>{project.description}</Text>}

        <Group gap={5}>
          {project.tags.map((tag) => (
            <Badge key={tag} variant="light">
              {tag}
            </Badge>
          ))}
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 4 }}>
          {details.map((d) => (
            <Stack key={d.label} gap={0}>
              <Text size="xs" c="dimmed">
                {d.label}
              </Text>
              <Text size="sm">{d.value}</Text>
            </Stack>
          ))}
        </SimpleGrid>

        {project.makers && project.makers.length > 0 && (
          <Stack gap={4}>
            <Text size="xs" c="dimmed">
              Makers
            </Text>
            <Group gap="sm">
              {project.makers.map((maker) =>
                maker.url ? (
                  <Anchor
                    key={maker.name}
                    href={maker.url}
                    target="_blank"
                    size="sm"
                  >
                    {maker.name}
                  </Anchor>
                ) : (
                  <Text key={maker.name} size="sm">
                    {maker.name}
                  </Text>
                ),
              )}
            </Group>
          </Stack>
        )}

        <Text size="xs" c="dimmed">
          É o maker deste projeto ou encontrou um erro?{" "}
          <Anchor href={EDIT_DATA_URL} target="_blank" size="xs">
            Edite no GitHub
          </Anchor>
          .
        </Text>
      </Stack>
      <Footer />
    </Container>
  );
}
