import { LoginButton } from "@/components/login-button/login-button";
import { RollingNumber } from "@/components/rolling-number/rolling-number";
import { Button } from "@/components/ui/button";
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

/** Threads shown before "Ver mais comentários". */
const THREADS_PAGE = 10;
/** Replies shown under a comment before "Ver mais N respostas". */
const REPLIES_SHOWN = 2;

export function Comments({ slug }: { slug: string }) {
  const { data, isLoading, isError, refetch } = useComments(slug);
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
  const [threadLimit, setThreadLimit] = useState(THREADS_PAGE);
  const threads = data ?? [];
  // A comment the user just posted is never left behind "Ver mais".
  const freshIndex =
    freshId === null
      ? -1
      : threads.findIndex(
          (thread) =>
            thread.id === freshId ||
            thread.replies.some((reply) => reply.id === freshId),
        );
  const shownThreads = threads.slice(0, Math.max(threadLimit, freshIndex + 1));
  const hiddenThreads = threads.length - shownThreads.length;
  return (
    <section id="project-comments"
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
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Não foi possível carregar os comentários.</span>
          <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}
      {data?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Ainda não há comentários. Sê o primeiro a dar feedback.
        </p>
      )}
      <div className="space-y-6">
        {shownThreads.map((comment) => (
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
      {hiddenThreads > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setThreadLimit((limit) => limit + THREADS_PAGE)}
        >
          Ver mais comentários ({hiddenThreads})
        </Button>
      )}
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
  const [expanded, setExpanded] = useState(false);
  const freshReply = comment.replies.findIndex((reply) => reply.id === freshId);
  const shownCount = expanded
    ? comment.replies.length
    : Math.max(REPLIES_SHOWN, freshReply + 1);
  const replies = comment.replies.slice(0, shownCount);
  const hiddenReplies = comment.replies.length - replies.length;
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
              {(index < replies.length - 1 || hiddenReplies > 0) && (
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
                canReply={canReply}
                isPending={isPending}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </li>
          ))}
          {hiddenReplies > 0 && (
            <li className="relative pt-4">
              <span
                aria-hidden
                className="absolute -left-[30.5px] top-0 h-[26px] w-[30.5px] rounded-bl-xl border-b border-l border-border"
              />
              <button
                type="button"
                className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                onClick={() => setExpanded(true)}
              >
                Ver mais {hiddenReplies}{" "}
                {hiddenReplies === 1 ? "resposta" : "respostas"}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
