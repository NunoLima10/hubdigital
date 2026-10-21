import { Footer } from "@/components/footer/footer";
import { Header } from "@/components/header/header";
import { projects, SUBMIT_URL } from "@/data";
import { ProjectList } from "@/features/project-list";
import { Button, Container, Group, Stack, Text, Title } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import classes from "./landing.module.css";

export function Landing() {
  return (
    <Container className={classes.container}>
      <Header />
      <Stack gap="xl">
        <Stack gap="sm">
          <Title ta={"center"} order={1}>
            HubDigital Cabo Verde
          </Title>
          <Container p={0} size={600}>
            <Text ta={"center"} size="md" c="dimmed">
              O diretório aberto de sites, apps e plataformas feitos em Cabo
              Verde. Descubra, partilhe e apoie projetos criados por
              cabo-verdianos.
            </Text>
          </Container>
          <Group justify="center">
            <Button
              component="a"
              href={SUBMIT_URL}
              target="_blank"
              variant="default"
              leftSection={<IconPlus size={16} />}
            >
              Submeter projeto
            </Button>
          </Group>
        </Stack>
        <ProjectList projects={projects} />
      </Stack>
      <Footer />
    </Container>
  );
}
