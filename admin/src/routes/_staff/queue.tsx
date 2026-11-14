import { approveProject, fetchProjects, rejectProject } from "@/api/admin";
import { PageHeader } from "@/components/page-header/page-header";
import { ReasonModal } from "@/components/reason-modal/reason-modal";
import { ProjectReviewPanel } from "@/modules/queue/components/project-review-panel/project-review-panel";
import { relativeTime } from "@/utils/relative-time";
import type { AdminProject } from "@hubdigital/shared";
import {
  Badge,
  Button,
  Card,
  Group,
  Kbd,
  Loader,
  ScrollArea,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import { IconCheck, IconInbox, IconX } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_staff/queue")({
  component: RouteComponent,
});

const QUEUE_KEY = ["admin", "projects", "pending"];

function RouteComponent() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rejectOpened, rejectModal] = useDisclosure(false);

  const { data, isPending } = useQuery({
    queryKey: QUEUE_KEY,
    queryFn: () =>
      fetchProjects({ status: "pending", sort: "queued", limit: 100 }),
  });

  const queue = data?.data ?? [];

  // Keep a selection alive across refetches, but never point at something the
  // last approval removed from the list.
  useEffect(() => {
    if (queue.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!queue.some((project) => project.id === selectedId)) {
      setSelectedId(queue[0].id);
    }
  }, [queue, selectedId]);

  const selected = queue.find((project) => project.id === selectedId) ?? null;
  const index = queue.findIndex((project) => project.id === selectedId);

  const approve = useMutation({
    mutationFn: (id: number) => approveProject(id),
    meta: {
      invalidatesQuery: QUEUE_KEY,
      successMessage: "Projeto aprovado e publicado.",
      errorMessage: "Não foi possível aprovar o projeto.",
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectProject(id, reason),
    meta: {
      invalidatesQuery: QUEUE_KEY,
      successMessage: "Projeto rejeitado. O autor vê o motivo no painel dele.",
      errorMessage: "Não foi possível rejeitar o projeto.",
    },
    onSuccess: rejectModal.close,
  });

  function move(delta: number) {
    if (queue.length === 0) return;
    const next = Math.min(Math.max(index + delta, 0), queue.length - 1);
    setSelectedId(queue[next].id);
  }

  // A queue is a repetitive surface; the shortcuts are what make it fast.
  useHotkeys([
    ["j", () => move(1)],
    ["k", () => move(-1)],
    ["a", () => selected && approve.mutate(selected.id)],
    ["r", () => selected && rejectModal.open()],
  ]);

  if (isPending) return <Loader />;

  return (
    <>
      <PageHeader
        title="Fila de revisão"
        description="Ordenada pelo tempo de espera — o mais antigo primeiro."
        action={
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              <Kbd>j</Kbd> <Kbd>k</Kbd> navegar · <Kbd>a</Kbd> aprovar ·{" "}
              <Kbd>r</Kbd> rejeitar
            </Text>
          </Group>
        }
      />

      {queue.length === 0 ? (
        <Card withBorder padding="xl">
          <Stack align="center" gap="xs">
            <IconInbox size={32} />
            <Title order={5}>Nada à espera</Title>
            <Text size="sm" c="dimmed" ta="center">
              Quando a revisão estiver ativa, as publicações aparecem aqui antes
              de irem para o site.
            </Text>
          </Stack>
        </Card>
      ) : (
        <Group align="flex-start" gap="lg" wrap="nowrap">
          <Stack gap="xs" w={320} style={{ flexShrink: 0 }}>
            {queue.map((project) => (
              <QueueRow
                key={project.id}
                project={project}
                active={project.id === selectedId}
                onSelect={() => setSelectedId(project.id)}
              />
            ))}
          </Stack>

          {selected && (
            <Card withBorder padding="lg" style={{ flex: 1 }}>
              <Stack gap="md">
                <Group justify="flex-end" gap="xs">
                  <Button
                    variant="default"
                    color="red"
                    leftSection={<IconX size={16} />}
                    onClick={rejectModal.open}
                  >
                    Rejeitar
                  </Button>
                  <Button
                    leftSection={<IconCheck size={16} />}
                    loading={approve.isPending}
                    onClick={() => approve.mutate(selected.id)}
                  >
                    Aprovar
                  </Button>
                </Group>

                <ScrollArea.Autosize mah="calc(100vh - 260px)">
                  <ProjectReviewPanel project={selected} />
                </ScrollArea.Autosize>
              </Stack>
            </Card>
          )}
        </Group>
      )}

      <ReasonModal
        opened={rejectOpened}
        onClose={rejectModal.close}
        onConfirm={(reason) =>
          selected && reject.mutate({ id: selected.id, reason })
        }
        title={`Rejeitar «${selected?.name ?? ""}»`}
        description="O projeto volta para o autor com este motivo. Ele pode corrigir e reenviar."
        confirmLabel="Rejeitar"
        danger
        visibleToTarget
        loading={reject.isPending}
      />
    </>
  );
}

function QueueRow({
  project,
  active,
  onSelect,
}: {
  project: AdminProject;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      withBorder
      padding="sm"
      onClick={onSelect}
      style={{
        cursor: "pointer",
        borderColor: active
          ? "var(--mantine-primary-color-filled)"
          : undefined,
      }}
    >
      <Stack gap={4}>
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" fw={500} lineClamp={1}>
            {project.name}
          </Text>
          {project.queuedAt && (
            <Badge size="xs" variant="light" color="yellow">
              {relativeTime(project.queuedAt)}
            </Badge>
          )}
        </Group>
        <Text size="xs" c="dimmed" lineClamp={2}>
          {project.shortDescription}
        </Text>
        <Text size="xs" c="dimmed">
          {project.publisher?.user.name}
        </Text>
      </Stack>
    </Card>
  );
}
