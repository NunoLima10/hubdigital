import {
  bulkModerateComments,
  deleteComment,
  fetchComments,
  hideComment,
  unhideComment,
  type CommentQuery,
} from "@/api/admin";
import {
  ProjectLink,
  UserLink,
} from "@/components/entity-link/entity-link";
import { ReasonModal } from "@/components/reason-modal/reason-modal";
import { CommentStateBadge } from "@/components/status-badge/status-badge";
import { relativeTime } from "@/utils/relative-time";
import { MODERATION_BULK_MAX } from "@hubdigital/shared";
import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Loader,
  Menu,
  Pagination,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDotsVertical,
  IconEye,
  IconEyeOff,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

const PAGE_SIZE = 25;

type CommentsTableProps = {
  projectId?: number;
  userId?: string;
  /** Extra filters rendered above the table by the standalone page. */
  filters?: React.ReactNode;
  state?: CommentQuery["state"];
  search?: string;
};

/**
 * The same table serves the standalone moderation feed and the per-project
 * section on a project page — "moderation for the project" is just this scoped
 * to one `projectId`.
 */
export function CommentsTable({
  projectId,
  userId,
  filters,
  state,
  search,
}: CommentsTableProps) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [pendingSingle, setPendingSingle] = useState<{
    id: number;
    action: "hide" | "delete";
  } | null>(null);
  const [bulkOpened, bulkModal] = useDisclosure(false);
  const [reasonOpened, reasonModal] = useDisclosure(false);

  const query: CommentQuery = {
    projectId,
    userId,
    state,
    q: search || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const queryKey = ["admin", "comments", query];

  const { data, isPending } = useQuery({
    queryKey,
    queryFn: () => fetchComments(query),
  });

  const meta = {
    invalidatesQuery: queryKey,
    errorMessage: "A ação não pôde ser concluída.",
  };

  const hide = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      hideComment(id, reason),
    meta: { ...meta, successMessage: "Comentário ocultado." },
    onSuccess: reasonModal.close,
  });

  const remove = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      deleteComment(id, reason),
    meta: { ...meta, successMessage: "Comentário removido." },
    onSuccess: reasonModal.close,
  });

  const unhide = useMutation({
    mutationFn: (id: number) => unhideComment(id),
    meta: { ...meta, successMessage: "Comentário novamente visível." },
  });

  const bulk = useMutation({
    mutationFn: ({
      action,
      reason,
    }: {
      action: "hide" | "delete";
      reason: string;
    }) => bulkModerateComments(selected, action, reason),
    meta: { ...meta, successMessage: "Comentários moderados." },
    onSuccess: () => {
      setSelected([]);
      bulkModal.close();
    },
  });

  const [bulkAction, setBulkAction] = useState<"hide" | "delete">("hide");
  const rows = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const selectable = rows.filter((row) => row.state !== "deleted");

  function openSingle(id: number, action: "hide" | "delete") {
    setPendingSingle({ id, action });
    reasonModal.open();
  }

  if (isPending) {
    return (
      <Group justify="center" p="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <Stack gap="sm">
      {filters}

      {selected.length > 0 && (
        <Group gap="xs">
          <Text size="sm">{selected.length} selecionado(s)</Text>
          <Button
            size="xs"
            variant="light"
            color="orange"
            leftSection={<IconEyeOff size={14} />}
            onClick={() => {
              setBulkAction("hide");
              bulkModal.open();
            }}
          >
            Ocultar
          </Button>
          <Button
            size="xs"
            variant="light"
            color="red"
            leftSection={<IconTrash size={14} />}
            onClick={() => {
              setBulkAction("delete");
              bulkModal.open();
            }}
          >
            Remover
          </Button>
          <Button size="xs" variant="subtle" onClick={() => setSelected([])}>
            Limpar
          </Button>
        </Group>
      )}

      <Table.ScrollContainer minWidth={720}>
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w={40}>
                <Checkbox
                  aria-label="Selecionar tudo"
                  checked={
                    selectable.length > 0 &&
                    selected.length === selectable.length
                  }
                  indeterminate={
                    selected.length > 0 && selected.length < selectable.length
                  }
                  onChange={(event) =>
                    setSelected(
                      event.currentTarget.checked
                        ? selectable
                            .slice(0, MODERATION_BULK_MAX)
                            .map((row) => row.id)
                        : []
                    )
                  }
                />
              </Table.Th>
              <Table.Th>Comentário</Table.Th>
              <Table.Th>Autor</Table.Th>
              {!projectId && <Table.Th>Projeto</Table.Th>}
              <Table.Th>Estado</Table.Th>
              <Table.Th w={60} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((comment) => (
              <Table.Tr key={comment.id}>
                <Table.Td>
                  <Checkbox
                    aria-label={`Selecionar comentário ${comment.id}`}
                    disabled={comment.state === "deleted"}
                    checked={selected.includes(comment.id)}
                    onChange={(event) =>
                      setSelected((previous) =>
                        event.currentTarget.checked
                          ? [...previous, comment.id].slice(
                              0,
                              MODERATION_BULK_MAX
                            )
                          : previous.filter((id) => id !== comment.id)
                      )
                    }
                  />
                </Table.Td>
                <Table.Td>
                  <Stack gap={2}>
                    <Text size="sm" lineClamp={3}>
                      {comment.body}
                    </Text>
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">
                        {relativeTime(comment.createdAt)}
                      </Text>
                      {comment.parentId && (
                        <Text size="xs" c="dimmed">
                          · resposta
                        </Text>
                      )}
                    </Group>
                    {comment.moderationReason && (
                      <Text size="xs" c="dimmed" fs="italic">
                        «{comment.moderationReason}»
                      </Text>
                    )}
                  </Stack>
                </Table.Td>
                <Table.Td>
                  {comment.author ? (
                    <Group gap={4}>
                      <UserLink id={comment.author.id} size="sm">
                        {comment.author.name}
                      </UserLink>
                      {comment.authorShadowBanned && (
                        <Tooltip label="Conta ocultada">
                          <IconEyeOff size={14} />
                        </Tooltip>
                      )}
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">
                      —
                    </Text>
                  )}
                </Table.Td>
                {!projectId && (
                  <Table.Td>
                    <ProjectLink id={comment.projectId} size="sm">
                      {comment.projectName}
                    </ProjectLink>
                  </Table.Td>
                )}
                <Table.Td>
                  <CommentStateBadge state={comment.state} />
                </Table.Td>
                <Table.Td>
                  {comment.state !== "deleted" && (
                    <Menu position="bottom-end" withArrow>
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Ações">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        {comment.state === "hidden" ? (
                          <Menu.Item
                            leftSection={<IconEye size={14} />}
                            onClick={() => unhide.mutate(comment.id)}
                          >
                            Reexpor
                          </Menu.Item>
                        ) : (
                          <Menu.Item
                            leftSection={<IconEyeOff size={14} />}
                            onClick={() => openSingle(comment.id, "hide")}
                          >
                            Ocultar
                          </Menu.Item>
                        )}
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={() => openSingle(comment.id, "delete")}
                        >
                          Remover
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
            {rows.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={projectId ? 5 : 6}>
                  <Text size="sm" c="dimmed" ta="center" py="lg">
                    Nenhum comentário.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {total > PAGE_SIZE && (
        <Group justify="center">
          <Pagination
            value={page}
            onChange={setPage}
            total={Math.ceil(total / PAGE_SIZE)}
          />
        </Group>
      )}

      <ReasonModal
        opened={reasonOpened}
        onClose={reasonModal.close}
        onConfirm={(reason) => {
          if (!pendingSingle) return;

          if (pendingSingle.action === "hide") {
            hide.mutate({ id: pendingSingle.id, reason });
          } else {
            remove.mutate({ id: pendingSingle.id, reason });
          }
        }}
        title={
          pendingSingle?.action === "delete"
            ? "Remover comentário"
            : "Ocultar comentário"
        }
        description={
          pendingSingle?.action === "delete"
            ? "O texto é substituído por uma marca de remoção e o lugar na conversa mantém-se, para as respostas não ficarem órfãs. Não é reversível."
            : "Sai da conversa pública mas o texto fica guardado para consulta. É reversível."
        }
        confirmLabel={
          pendingSingle?.action === "delete" ? "Remover" : "Ocultar"
        }
        danger={pendingSingle?.action === "delete"}
        loading={hide.isPending || remove.isPending}
      />

      <ReasonModal
        opened={bulkOpened}
        onClose={bulkModal.close}
        onConfirm={(reason) => bulk.mutate({ action: bulkAction, reason })}
        title={`${bulkAction === "hide" ? "Ocultar" : "Remover"} ${selected.length} comentário(s)`}
        description="O mesmo motivo fica registado em cada um deles."
        confirmLabel={bulkAction === "hide" ? "Ocultar" : "Remover"}
        danger={bulkAction === "delete"}
        loading={bulk.isPending}
      />
    </Stack>
  );
}
