import { LoginButton } from "@/components/login-button/login-button";
import { authClient } from "@/lib/auth-client";
import { Box, Divider, Group, Skeleton, Stack, Text, Title } from "@mantine/core";
import { CommentComposer } from "./components/comment-composer/comment-composer";
import { CommentItem } from "./components/comment-item/comment-item";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from "./hooks/use-comments";

type CommentsProps = {
  slug: string;
};

export function Comments({ slug }: CommentsProps) {
  const { data, isLoading, isError } = useComments(slug);
  const { data: session } = authClient.useSession();

  const { createComment, isPending: isCreating } = useCreateComment(slug);
  const { updateComment, isPending: isUpdating } = useUpdateComment(slug);
  const { deleteComment, isPending: isDeleting } = useDeleteComment(slug);

  const isPending = isCreating || isUpdating || isDeleting;
  const total =
    data?.reduce((count, comment) => count + 1 + comment.replies.length, 0) ?? 0;

  return (
    <Stack gap="md">
      <Divider />
      <Group gap="xs" align="baseline">
        <Title order={4}>Comentários</Title>
        {total > 0 && (
          <Text c="dimmed" size="sm">
            {total}
          </Text>
        )}
      </Group>

      {session ? (
        <CommentComposer
          onSubmit={(body) => createComment({ body })}
          isPending={isCreating}
        />
      ) : (
        <Group gap="sm">
          <Text size="sm" c="dimmed">
            Entra na tua conta para comentar.
          </Text>
          <LoginButton />
        </Group>
      )}

      {isLoading && (
        <Stack gap="md">
          <Skeleton h={56} radius="sm" />
          <Skeleton h={56} radius="sm" />
        </Stack>
      )}

      {isError && (
        <Text c="dimmed" size="sm">
          Não foi possível carregar os comentários.
        </Text>
      )}

      {data && data.length === 0 && (
        <Text c="dimmed" size="sm">
          Ainda não há comentários. Sê o primeiro a dar feedback.
        </Text>
      )}

      <Stack gap="lg">
        {data?.map((comment) => (
          <Stack key={comment.id} gap="md">
            <CommentItem
              comment={comment}
              canReply={Boolean(session)}
              isPending={isPending}
              onReply={(parentId, body) => createComment({ body, parentId })}
              onEdit={(id, body) => updateComment({ id, body })}
              onDelete={deleteComment}
            />

            {comment.replies.length > 0 && (
              <Box pl={40}>
                <Stack gap="md">
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      isReply
                      canReply={false}
                      isPending={isPending}
                      onEdit={(id, body) => updateComment({ id, body })}
                      onDelete={deleteComment}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
