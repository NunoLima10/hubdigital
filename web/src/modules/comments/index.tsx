import { LoginButton } from "@/components/login-button/login-button";
import { RollingNumber } from "@/components/rolling-number/rolling-number";
import { useDelayedLoading } from "@/hooks/use-delayed-loading";
import { authClient } from "@/lib/auth-client";
import type { Comment, CommentBody } from "@hubdigital/shared";
import { useState } from "react";
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
  const showLoading = useDelayedLoading(isLoading);
  const { data: session } = authClient.useSession();
  const { createComment, isPending: isCreating } = useCreateComment(slug);
  const { updateComment, isPending: isUpdating } = useUpdateComment(slug);
  const { deleteComment, isPending: isDeleting } = useDeleteComment(slug);
  const isPending = isCreating || isUpdating || isDeleting;
  // The comment the user just posted, so it can slide in once it arrives.
  const [freshId, setFreshId] = useState<number | null>(null);
  const post = (payload: CommentBody) =>
    createComment(payload, { onSuccess: (response) => setFreshId(response.data.id) });
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
          {total > 0 && <RollingNumber value={total} />}
        </span>
      </h2>
      {session ? (
        <CommentComposer
          onSubmit={(body) => post({ body })}
          isPending={isCreating}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          Entra na tua conta para comentar.
          <LoginButton />
        </div>
      )}
      {showLoading && (
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
          <CommentThreadView
            key={comment.id}
            comment={comment}
            freshId={freshId}
            canReply={Boolean(session)}
            isPending={isPending}
            onReply={(parentId, body) => post({ body, parentId })}
            onEdit={(id, body) => updateComment({ id, body })}
            onDelete={deleteComment}
          />
        ))}
      </div>
    </section>
  );
}

function CommentThreadView({
  comment,
  freshId,
  canReply,
  isPending,
  onReply,
  onEdit,
  onDelete,
}: {
  comment: Comment;
  freshId: number | null;
  canReply: boolean;
  isPending: boolean;
  onReply: (parentId: number, body: string) => void;
  onEdit: (id: number, body: string) => void;
  onDelete: (id: number) => void;
}) {
  const replies = comment.replies;
  return (
    <div>
      <CommentItem
        comment={comment}
        isNew={comment.id === freshId}
        hasReplies={replies.length > 0}
        canReply={canReply}
        isPending={isPending}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      {replies.length > 0 && (
        // pl-12 puts reply avatars under the parent's text column; the
        // connectors sit on the parent avatar's centre line (36px avatar / 2).
        <ul className="pl-12">
          {replies.map((reply, index) => (
            <li key={reply.id} className="relative pt-4">
              {index < replies.length - 1 && (
                <span
                  aria-hidden
                  className="absolute -left-[30.5px] top-0 bottom-0 w-px bg-border"
                />
              )}
              <span
                aria-hidden
                className="absolute -left-[30.5px] top-0 h-[30px] w-[30.5px] rounded-bl-xl border-b border-l border-border"
              />
              <CommentItem
                comment={reply}
                isNew={reply.id === freshId}
                isReply
                canReply={false}
                isPending={isPending}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
