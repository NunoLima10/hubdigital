import { fetchUser, hideUser, unhideUser } from "@/api/admin";
import { AuditHistory } from "@/components/audit-history/audit-history";
import { ProjectLink } from "@/components/entity-link/entity-link";
import { PageHeader } from "@/components/page-header/page-header";
import { ReasonModal } from "@/components/reason-modal/reason-modal";
import {
  BannedBadge,
  HiddenBadge,
  ProjectStatusBadge,
  TrustedBadge,
} from "@/components/status-badge/status-badge";
import { CommentsTable } from "@/modules/comments/components/comments-table/comments-table";
import { relativeTime } from "@/utils/relative-time";
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_staff/users/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const queryKey = ["admin", "user", id];

  const [hideOpened, hideModal] = useDisclosure(false);

  const { data: user, isPending } = useQuery({
    queryKey,
    queryFn: () => fetchUser(id),
  });

  const meta = {
    invalidatesQuery: queryKey,
    errorMessage: "A ação não pôde ser concluída.",
  };

  const hide = useMutation({
    mutationFn: (reason: string) => hideUser(id, reason),
    meta: { ...meta, successMessage: "Conta ocultada. O utilizador é informado." },
    onSuccess: hideModal.close,
  });

  const unhide = useMutation({
    mutationFn: () => unhideUser(id),
    meta: { ...meta, successMessage: "Conta novamente visível." },
  });

  if (isPending || !user) return <Loader />;

  const counters = [
    { label: "Projetos", value: user.projectCount },
    { label: "Comentários", value: user.commentCount },
    { label: "Votos dados", value: user.upvoteCount },
  ];

  return (
    <>
      <PageHeader
        title={user.name}
        description={user.email}
        action={
          <Anchor component={Link} to="/users" size="sm">
            ← Todos os utilizadores
          </Anchor>
        }
      />

      <Stack gap="md">
        {user.shadowBannedAt && (
          <Alert color="orange" variant="light" title="Conta ocultada">
            <Text size="sm">
              Oculta desde {relativeTime(user.shadowBannedAt)}. Continua a ver o
              próprio conteúdo e sabe o motivo: «{user.shadowBanReason}». As
              contagens de votos não foram alteradas.
            </Text>
          </Alert>
        )}

        {user.banned && (
          <Alert color="red" variant="light" title="Conta banida">
            <Text size="sm">
              {user.banReason ?? "Sem motivo registado."} O acesso está
              bloqueado — o banimento é gerido pelo Better Auth.
            </Text>
          </Alert>
        )}

        <Card withBorder padding="md">
          <Group justify="space-between">
            <Group gap="xs">
              <Badge
                variant="light"
                color={user.role === "admin" ? "red" : "gray"}
              >
                {user.role === "admin" ? "Admin" : "Utilizador"}
              </Badge>
              {user.shadowBannedAt && <HiddenBadge />}
              {user.banned && <BannedBadge />}
              {user.publisher?.trustedAt && <TrustedBadge />}
              {user.handle && (
                <Text size="sm" c="dimmed">
                  @{user.handle}
                </Text>
              )}
            </Group>

            {user.shadowBannedAt ? (
              <Button
                variant="default"
                leftSection={<IconEye size={16} />}
                loading={unhide.isPending}
                onClick={() => unhide.mutate()}
              >
                Reexpor conta
              </Button>
            ) : (
              <Button
                variant="default"
                color="orange"
                leftSection={<IconEyeOff size={16} />}
                onClick={hideModal.open}
              >
                Ocultar conta
              </Button>
            )}
          </Group>
        </Card>

        <SimpleGrid cols={{ base: 3 }} spacing="md">
          {counters.map((counter) => (
            <Card key={counter.label} withBorder padding="md">
              <Text size="sm" c="dimmed">
                {counter.label}
              </Text>
              <Title order={3}>{counter.value}</Title>
            </Card>
          ))}
        </SimpleGrid>

        <Grid>
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Card withBorder padding="lg">
              <Stack gap="sm">
                <Title order={5}>Projetos</Title>
                {user.projects.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    Ainda não submeteu nenhum projeto.
                  </Text>
                ) : (
                  <Stack gap="xs">
                    {user.projects.map((project) => (
                      <Group key={project.id} justify="space-between">
                        <ProjectLink id={project.id} size="sm">
                          {project.name}
                        </ProjectLink>
                        <Group gap={4}>
                          <ProjectStatusBadge
                            status={project.status}
                            size="sm"
                          />
                          {project.shadowBannedAt && <HiddenBadge size="sm" />}
                        </Group>
                      </Group>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Stack gap="md">
              {user.publisher && (
                <Card withBorder padding="lg">
                  <Stack gap="xs">
                    <Title order={5}>Perfil de maker</Title>
                    <Text size="sm">{user.publisher.bio}</Text>
                    {user.publisher.websiteUrl && (
                      <Anchor href={user.publisher.websiteUrl} size="xs">
                        {user.publisher.websiteUrl}
                      </Anchor>
                    )}
                  </Stack>
                </Card>
              )}

              <Card withBorder padding="lg">
                <Stack gap="sm">
                  <Title order={5}>Histórico</Title>
                  <AuditHistory entries={user.history} />
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>

        <Card withBorder padding="lg">
          <Stack gap="sm">
            <Title order={5}>Comentários desta conta</Title>
            <CommentsTable userId={id} />
          </Stack>
        </Card>
      </Stack>

      <ReasonModal
        opened={hideOpened}
        onClose={hideModal.close}
        onConfirm={(reason) => hide.mutate(reason)}
        title="Ocultar conta"
        description="Os projetos e comentários desta conta deixam de aparecer para toda a gente — exceto para ela própria, que continua a vê-los e é informada deste motivo. As contagens de votos ficam como estão."
        confirmLabel="Ocultar"
        danger
        visibleToTarget
        loading={hide.isPending}
      />
    </>
  );
}
