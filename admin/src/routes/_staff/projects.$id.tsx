import {
  approveProject,
  fetchProject,
  hideProject,
  rejectProject,
  restoreProject,
  setPublisherTrusted,
  unhideProject,
  unpublishProject,
} from "@/api/admin";
import { AuditHistory } from "@/components/audit-history/audit-history";
import { UserLink } from "@/components/entity-link/entity-link";
import { PageHeader } from "@/components/page-header/page-header";
import { ReasonModal } from "@/components/reason-modal/reason-modal";
import {
  HiddenBadge,
  TrustedBadge,
} from "@/components/status-badge/status-badge";
import { CommentsTable } from "@/modules/comments/components/comments-table/comments-table";
import { ProjectReviewPanel } from "@/modules/queue/components/project-review-panel/project-review-panel";
import { relativeTime } from "@/utils/relative-time";
import {
  Alert,
  Anchor,
  Button,
  Card,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconArrowBackUp,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_staff/projects/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const projectId = Number(id);
  const queryKey = ["admin", "project", projectId];

  const [hideOpened, hideModal] = useDisclosure(false);
  const [rejectOpened, rejectModal] = useDisclosure(false);
  const [unpublishOpened, unpublishModal] = useDisclosure(false);

  const { data: project, isPending } = useQuery({
    queryKey,
    queryFn: () => fetchProject(projectId),
  });

  function action<T>(
    fn: (input: T) => Promise<unknown>,
    successMessage: string,
    onSuccess?: () => void
  ) {
    return {
      mutationFn: fn,
      meta: {
        invalidatesQuery: queryKey,
        successMessage,
        errorMessage: "A ação não pôde ser concluída.",
      },
      onSuccess,
    };
  }

  const approve = useMutation(
    action(() => approveProject(projectId), "Projeto aprovado.")
  );
  const reject = useMutation(
    action(
      (reason: string) => rejectProject(projectId, reason),
      "Projeto rejeitado.",
      rejectModal.close
    )
  );
  const unpublish = useMutation(
    action(
      (reason: string) => unpublishProject(projectId, reason),
      "Projeto despublicado.",
      unpublishModal.close
    )
  );
  const restore = useMutation(
    action(() => restoreProject(projectId), "Projeto restaurado.")
  );
  const hide = useMutation(
    action(
      (reason: string) => hideProject(projectId, reason),
      "Projeto ocultado. O autor vê o motivo.",
      hideModal.close
    )
  );
  const unhide = useMutation(
    action(() => unhideProject(projectId), "Projeto novamente visível.")
  );
  const trust = useMutation(
    action(
      (trusted: boolean) =>
        setPublisherTrusted(project!.publisher!.id, trusted),
      "Estado de confiança atualizado."
    )
  );

  if (isPending || !project) return <Loader />;

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.slug}
        action={
          <Anchor component={Link} to="/projects" size="sm">
            ← Todos os projetos
          </Anchor>
        }
      />

      <Stack gap="md">
        {project.deletedAt && (
          <Alert color="red" variant="light" title="Eliminado pelo autor">
            <Group justify="space-between">
              <Text size="sm">
                Eliminado {relativeTime(project.deletedAt)}. Continua fora do
                site até ser restaurado.
              </Text>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconArrowBackUp size={14} />}
                loading={restore.isPending}
                onClick={() => restore.mutate(undefined as never)}
              >
                Restaurar
              </Button>
            </Group>
          </Alert>
        )}

        {project.shadowBannedAt && (
          <Alert color="orange" variant="light" title="Projeto ocultado">
            <Text size="sm">
              Oculto desde {relativeTime(project.shadowBannedAt)}. O autor
              continua a vê-lo e sabe o motivo: «{project.shadowBanReason}»
            </Text>
          </Alert>
        )}

        {project.status === "rejected" && project.rejectionReason && (
          <Alert color="red" variant="light" title="Rejeitado">
            <Text size="sm">«{project.rejectionReason}»</Text>
          </Alert>
        )}

        <Card withBorder padding="md">
          <Group gap="xs" wrap="wrap">
            {project.status === "pending" && (
              <>
                <Button
                  leftSection={<IconCheck size={16} />}
                  loading={approve.isPending}
                  onClick={() => approve.mutate(undefined as never)}
                >
                  Aprovar
                </Button>
                <Button
                  variant="default"
                  leftSection={<IconX size={16} />}
                  onClick={rejectModal.open}
                >
                  Rejeitar
                </Button>
              </>
            )}

            {project.status === "published" && (
              <Button
                variant="default"
                leftSection={<IconArrowBackUp size={16} />}
                onClick={unpublishModal.open}
              >
                Despublicar
              </Button>
            )}

            {project.shadowBannedAt ? (
              <Button
                variant="default"
                leftSection={<IconEye size={16} />}
                loading={unhide.isPending}
                onClick={() => unhide.mutate(undefined as never)}
              >
                Reexpor
              </Button>
            ) : (
              <Button
                variant="default"
                color="orange"
                leftSection={<IconEyeOff size={16} />}
                onClick={hideModal.open}
              >
                Ocultar
              </Button>
            )}

            {project.publisher && (
              <Button
                variant="default"
                leftSection={<IconShieldCheck size={16} />}
                loading={trust.isPending}
                onClick={() => trust.mutate(!project.publisher!.trustedAt)}
              >
                {project.publisher.trustedAt
                  ? "Retirar confiança"
                  : "Marcar como confiança"}
              </Button>
            )}
          </Group>
        </Card>

        <Grid>
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Card withBorder padding="lg">
              <ProjectReviewPanel project={project} />
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Stack gap="md">
              <Card withBorder padding="lg">
                <Stack gap="sm">
                  <Title order={5}>Autor</Title>
                  {project.publisher ? (
                    <Stack gap={4}>
                      <Group gap="xs">
                        <UserLink id={project.publisher.user.id} size="sm">
                          {project.publisher.user.name}
                        </UserLink>
                        {project.publisher.trustedAt && (
                          <TrustedBadge size="sm" />
                        )}
                        {project.publisher.user.shadowBannedAt && (
                          <HiddenBadge size="sm" />
                        )}
                      </Group>
                      <Text size="xs" c="dimmed">
                        {project.publisher.user.email}
                      </Text>
                    </Stack>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Sem autor associado.
                    </Text>
                  )}
                </Stack>
              </Card>

              <Card withBorder padding="lg">
                <Stack gap="sm">
                  <Title order={5}>Histórico</Title>
                  <AuditHistory entries={project.history} />
                </Stack>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>

        <Card withBorder padding="lg">
          <Stack gap="sm">
            <Title order={5}>Comentários deste projeto</Title>
            <CommentsTable projectId={projectId} />
          </Stack>
        </Card>
      </Stack>

      <ReasonModal
        opened={rejectOpened}
        onClose={rejectModal.close}
        onConfirm={(reason) => reject.mutate(reason)}
        title="Rejeitar projeto"
        description="O projeto volta para o autor com este motivo."
        confirmLabel="Rejeitar"
        danger
        visibleToTarget
        loading={reject.isPending}
      />

      <ReasonModal
        opened={unpublishOpened}
        onClose={unpublishModal.close}
        onConfirm={(reason) => unpublish.mutate(reason)}
        title="Despublicar projeto"
        description="Volta a rascunho e sai do site. O autor pode corrigir e publicar de novo."
        confirmLabel="Despublicar"
        danger
        loading={unpublish.isPending}
      />

      <ReasonModal
        opened={hideOpened}
        onClose={hideModal.close}
        onConfirm={(reason) => hide.mutate(reason)}
        title="Ocultar projeto"
        description="Deixa de aparecer no site e no ranking. O autor continua a vê-lo e é informado deste motivo. As contagens de votos não mudam."
        confirmLabel="Ocultar"
        danger
        visibleToTarget
        loading={hide.isPending}
      />
    </>
  );
}
