import { LoginButton } from "@/components/login-button/login-button";
import { authClient } from "@/lib/auth-client";
import { CommentComposer } from "./components/comment-composer/comment-composer";
import { CommentItem } from "./components/comment-item/comment-item";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from "./hooks/use-comments";

export function Comments({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useComments(slug);
  const { data: session } = authClient.useSession();
  const { createComment, isPending: isCreating } = useCreateComment(slug);
  const { updateComment, isPending: isUpdating } = useUpdateComment(slug);
  const { deleteComment, isPending: isDeleting } = useDeleteComment(slug);
  const isPending = isCreating || isUpdating || isDeleting;
  const total =
    data?.reduce((count, comment) => count + 1 + comment.replies.length, 0) ??
    0;
  return (
    <section
      aria-labelledby="comments-title"
      className="space-y-5 border-t pt-6"
    >
      <h2 id="comments-title" className="text-lg font-semibold">
        Comentários{" "}
        <span className="text-sm font-normal text-muted-foreground">
          {total || ""}
        </span>
      </h2>
      {session ? (
        <CommentComposer
          onSubmit={(body) => createComment({ body })}
          isPending={isCreating}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          Entra na tua conta para comentar.
          <LoginButton />
        </div>
      )}
      {isLoading && (
        <div className="space-y-3" aria-label="A carregar comentários">
          <div className="h-14 animate-pulse rounded bg-muted" />
          <div className="h-14 animate-pulse rounded bg-muted" />
        </div>
      )}
      {isError && (
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar os comentários.
        </p>
      )}
      {data?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Ainda não há comentários. Sê o primeiro a dar feedback.
        </p>
      )}
      <div className="space-y-6">
        {data?.map((comment) => (
          <div key={comment.id} className="space-y-4">
            <CommentItem
              comment={comment}
              canReply={Boolean(session)}
              isPending={isPending}
              onReply={(parentId, body) => createComment({ body, parentId })}
              onEdit={(id, body) => updateComment({ id, body })}
              onDelete={deleteComment}
            />
            {comment.replies.length > 0 && (
              <div className="space-y-4 pl-8 sm:pl-12">
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
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
