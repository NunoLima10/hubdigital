import { ReportButton } from "@/modules/reports/components/report-button/report-button";
import type { Comment, CommentReply } from "@hubdigital/shared";
import { Anchor, Avatar, Box, Flex, Group, Stack, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { relativeTime } from "../../utils/relative-time";
import { CommentComposer } from "../comment-composer/comment-composer";

type CommentActions = {
  onReply?: (parentId: number, body: string) => void;
  onEdit: (id: number, body: string) => void;
  onDelete: (id: number) => void;
  canReply: boolean;
  isPending?: boolean;
};

type CommentItemProps = CommentActions & {
  comment: Comment | CommentReply;
  /** Replies render slightly smaller and cannot be replied to themselves. */
  isReply?: boolean;
};

export function CommentItem({
  comment,
  isReply = false,
  onReply,
  onEdit,
  onDelete,
  canReply,
  isPending,
}: CommentItemProps) {
  const [mode, setMode] = useState<"view" | "edit" | "reply">("view");

  return (
    <Stack gap={6}>
      <Flex gap="sm" align="flex-start">
        <Avatar
          src={comment.author?.image ?? undefined}
          radius="xl"
          size={isReply ? "sm" : "md"}
        >
          {comment.author?.name?.[0]?.toUpperCase() ?? "?"}
        </Avatar>

        <Stack gap={2} style={{ flex: 1 }}>
          <Group gap="xs">
            {comment.author?.handle ? (
              <Anchor
                renderRoot={(props) => (
                  <Link
                    to="/makers/$handle"
                    params={{ handle: comment.author?.handle as string }}
                    {...props}
                  />
                )}
                fw={600}
                size="sm"
              >
                {comment.author.name}
              </Anchor>
            ) : (
              <Text fw={600} size="sm">
                {comment.author?.name ?? "Utilizador removido"}
              </Text>
            )}
            <Text size="xs" c="dimmed">
              {relativeTime(comment.createdAt)}
            </Text>
            {comment.updatedAt !== comment.createdAt && !comment.isDeleted && (
              <Text size="xs" c="dimmed">
                (editado)
              </Text>
            )}
          </Group>

          {mode === "edit" ? (
            <CommentComposer
              initialValue={comment.body}
              submitLabel="Guardar"
              isPending={isPending}
              autoFocus
              onCancel={() => setMode("view")}
              onSubmit={(body) => {
                onEdit(comment.id, body);
                setMode("view");
              }}
            />
          ) : (
            <Text
              size="sm"
              c={comment.isDeleted ? "dimmed" : undefined}
              fs={comment.isDeleted ? "italic" : undefined}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {comment.body}
            </Text>
          )}

          {mode === "view" && !comment.isDeleted && (
            <Group gap="md" mt={2}>
              {canReply && !isReply && onReply && (
                <Anchor
                  component="button"
                  type="button"
                  size="xs"
                  c="dimmed"
                  onClick={() => setMode("reply")}
                >
                  Responder
                </Anchor>
              )}
              {comment.isOwn && (
                <>
                  <Anchor
                    component="button"
                    type="button"
                    size="xs"
                    c="dimmed"
                    onClick={() => setMode("edit")}
                  >
                    Editar
                  </Anchor>
                  <Anchor
                    component="button"
                    type="button"
                    size="xs"
                    c="red.6"
                    onClick={() => onDelete(comment.id)}
                  >
                    Remover
                  </Anchor>
                </>
              )}
              {!comment.isOwn && (
                <ReportButton targetType="comment" targetId={comment.id} />
              )}
            </Group>
          )}

          {mode === "reply" && onReply && (
            <Box mt="xs">
              <CommentComposer
                placeholder={`Responder a ${comment.author?.name ?? "este comentário"}...`}
                submitLabel="Responder"
                isPending={isPending}
                autoFocus
                onCancel={() => setMode("view")}
                onSubmit={(body) => {
                  onReply(comment.id, body);
                  setMode("view");
                }}
              />
            </Box>
          )}
        </Stack>
      </Flex>
    </Stack>
  );
}
