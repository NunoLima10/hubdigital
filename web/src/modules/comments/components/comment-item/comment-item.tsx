import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ReportButton } from "@/modules/reports/components/report-button/report-button";
import type { Comment, CommentReply } from "@hubdigital/shared";
import { Link } from "@tanstack/react-router";
import { prefersReducedMotion, replay } from "@/lib/motion";
import { Flag, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { fullDate, relativeTime } from "../../utils/relative-time";
import { CommentComposer } from "../comment-composer/comment-composer";

type Props = {
  comment: Comment | CommentReply;
  isReply?: boolean;
  /** The user's own just-posted comment: slides in with a brief highlight. */
  isNew?: boolean;
  /** Draws a line down from the avatar into the replies below. */
  hasReplies?: boolean;
  onReply?: (parentId: number, body: string) => void;
  onEdit: (id: number, body: string) => void;
  onDelete: (id: number) => void;
  canReply: boolean;
  isPending?: boolean;
};
export function CommentItem({
  comment,
  isReply = false,
  isNew = false,
  hasReplies = false,
  onReply,
  onEdit,
  onDelete,
  canReply,
  isPending,
}: Props) {
  const [mode, setMode] = useState<"view" | "edit" | "reply">("view");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const article = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (!isNew || !article.current) return;
    article.current.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    if (prefersReducedMotion()) return;
    replay(
      article.current,
      [
        { opacity: 0, transform: "translateY(-8px)", backgroundColor: "var(--muted)" },
        { opacity: 1, transform: "translateY(0)", backgroundColor: "var(--muted)", offset: 0.3 },
        { opacity: 1, transform: "translateY(0)", backgroundColor: "transparent" },
      ],
      { duration: 1600, easing: "ease-out" },
    );
  }, [isNew]);
  const actionClass =
    "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline";
  return (
    <article
      ref={article}
      id={`comment-${comment.id}`}
      className="-m-2 flex gap-3 rounded-lg p-2"
    >
      <div className="flex shrink-0 flex-col items-center">
        <span
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold ${isReply ? "size-7" : "size-9"}`}
        >
          {comment.author?.image ? (
            <img
              src={comment.author.image}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            (comment.author?.name?.[0]?.toUpperCase() ?? "?")
          )}
        </span>
        {/* Carries on into the reply connectors drawn by the thread list. */}
        {hasReplies && <span aria-hidden className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {comment.author?.handle ? (
            <Link
              to="/makers/$handle"
              params={{ handle: comment.author.handle }}
              className="font-semibold hover:underline"
            >
              {comment.author.name}
            </Link>
          ) : (
            // A deleted comment hides its author on purpose; a missing author on
            // a live one means the account itself is gone.
            <strong className={comment.isDeleted ? "font-medium text-muted-foreground" : undefined}>
              {comment.isDeleted
                ? "Comentário removido"
                : (comment.author?.name ?? "Conta removida")}
            </strong>
          )}
          <span aria-hidden className="text-xs text-muted-foreground">·</span>
          <time
            dateTime={comment.createdAt}
            title={fullDate(comment.createdAt)}
            className="text-xs text-muted-foreground"
          >
            {relativeTime(comment.createdAt)}
          </time>
          {comment.updatedAt !== comment.createdAt && !comment.isDeleted && (
            <span
              title={`Editado ${fullDate(comment.updatedAt)}`}
              className="text-xs text-muted-foreground"
            >
              (editado)
            </span>
          )}
        </div>
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
          // The header already says the comment was removed; the API's
          // placeholder body would only repeat it.
          !comment.isDeleted && (
            <p className="whitespace-pre-wrap break-words text-sm leading-6">{comment.body}</p>
          )
        )}
        {mode === "view" && !comment.isDeleted && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                {canReply && !isReply && onReply && (
                  <button className={actionClass} onClick={() => setMode("reply")}>
                    <MessageCircle className="size-3.5" />
                    Responder
                  </button>
                )}
                {comment.isOwn ? (
                  <>
                    <button className={actionClass} onClick={() => setMode("edit")}>
                      <Pencil className="size-3.5" />
                      Editar
                    </button>
                    <button
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive hover:underline"
                      onClick={() => setConfirmingDelete(true)}
                    >
                      <Trash2 className="size-3.5" />
                      Remover
                    </button>
                    <Dialog
                      open={confirmingDelete}
                      onClose={() => setConfirmingDelete(false)}
                      title="Remover comentário"
                    >
                      <p className="text-sm">
                        Queres mesmo remover este comentário? As respostas continuam
                        visíveis, mas o teu texto desaparece.
                      </p>
                      <div className="mt-5 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setConfirmingDelete(false)}>
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setConfirmingDelete(false);
                            onDelete(comment.id);
                          }}
                        >
                          Remover
                        </Button>
                      </div>
                    </Dialog>
                  </>
                ) : (
                  <ReportButton
                    targetType="comment"
                    targetId={comment.id}
                    icon={<Flag className="size-3.5" />}
                  />
                )}
          </div>
        )}
        {mode === "reply" && onReply && (
          <div className="pt-2">
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
          </div>
        )}
      </div>
    </article>
  );
}
