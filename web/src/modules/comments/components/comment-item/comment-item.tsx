import { ReportButton } from "@/modules/reports/components/report-button/report-button";
import type { Comment, CommentReply } from "@hubdigital/shared";
import { Link } from "@tanstack/react-router";
import { prefersReducedMotion, replay } from "@/lib/motion";
import { useLayoutEffect, useRef, useState } from "react";
import { relativeTime } from "../../utils/relative-time";
import { CommentComposer } from "../comment-composer/comment-composer";

type Props = {
  comment: Comment | CommentReply;
  isReply?: boolean;
  /** The user's own just-posted comment: slides in with a brief highlight. */
  isNew?: boolean;
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
  onReply,
  onEdit,
  onDelete,
  canReply,
  isPending,
}: Props) {
  const [mode, setMode] = useState<"view" | "edit" | "reply">("view");
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
  const linkClass =
    "text-xs text-muted-foreground hover:text-foreground hover:underline";
  return (
    <article ref={article} className="-m-2 flex gap-3 rounded-lg p-2">
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
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {comment.author?.handle ? (
            <Link
              to="/makers/$handle"
              params={{ handle: comment.author.handle }}
              className="font-semibold hover:underline"
            >
              {comment.author.name}
            </Link>
          ) : (
            <strong>{comment.author?.name ?? "Utilizador removido"}</strong>
          )}
          <span className="text-xs text-muted-foreground">
            {relativeTime(comment.createdAt)}
          </span>
          {comment.updatedAt !== comment.createdAt && !comment.isDeleted && (
            <span className="text-xs text-muted-foreground">(editado)</span>
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
          <p
            className={`whitespace-pre-wrap text-sm leading-6 ${comment.isDeleted ? "italic text-muted-foreground" : ""}`}
          >
            {comment.body}
          </p>
        )}
        {mode === "view" && !comment.isDeleted && (
          <div className="flex items-center gap-4 pt-1">
            {canReply && !isReply && onReply && (
              <button className={linkClass} onClick={() => setMode("reply")}>
                Responder
              </button>
            )}
            {comment.isOwn ? (
              <>
                <button className={linkClass} onClick={() => setMode("edit")}>
                  Editar
                </button>
                <button
                  className="text-xs text-destructive hover:underline"
                  onClick={() => onDelete(comment.id)}
                >
                  Remover
                </button>
              </>
            ) : (
              <ReportButton targetType="comment" targetId={comment.id} />
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
