import { ReportButton } from "@/modules/reports/components/report-button/report-button";
import type { Comment, CommentReply } from "@hubdigital/shared";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { relativeTime } from "../../utils/relative-time";
import { CommentComposer } from "../comment-composer/comment-composer";

type Props = {
  comment: Comment | CommentReply;
  isReply?: boolean;
  onReply?: (parentId: number, body: string) => void;
  onEdit: (id: number, body: string) => void;
  onDelete: (id: number) => void;
  canReply: boolean;
  isPending?: boolean;
};
export function CommentItem({
  comment,
  isReply = false,
  onReply,
  onEdit,
  onDelete,
  canReply,
  isPending,
}: Props) {
  const [mode, setMode] = useState<"view" | "edit" | "reply">("view");
  const linkClass =
    "text-xs text-muted-foreground hover:text-foreground hover:underline";
  return (
    <article className="flex gap-3">
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
