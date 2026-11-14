import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { COMMENT_MAX_LENGTH } from "@hubdigital/shared";
import { useState } from "react";

type Props = {
  onSubmit: (body: string) => void;
  isPending?: boolean;
  placeholder?: string;
  submitLabel?: string;
  onCancel?: () => void;
  initialValue?: string;
  autoFocus?: boolean;
};
export function CommentComposer({
  onSubmit,
  isPending,
  placeholder = "Escreve um comentário...",
  submitLabel = "Comentar",
  onCancel,
  initialValue = "",
  autoFocus,
}: Props) {
  const [body, setBody] = useState(initialValue);
  const trimmed = body.trim();
  const isTooLong = trimmed.length > COMMENT_MAX_LENGTH;
  const canSubmit = trimmed.length > 0 && !isTooLong && !isPending;
  function submit() {
    if (!canSubmit) return;
    onSubmit(trimmed);
    setBody("");
  }
  return (
    <div className="space-y-2">
      <Textarea
        value={body}
        onChange={(event) => setBody(event.currentTarget.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-invalid={isTooLong}
      />
      {isTooLong && (
        <p className="text-xs text-destructive">
          Máximo de {COMMENT_MAX_LENGTH} caracteres.
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancelar
          </Button>
        )}
        <Button size="sm" onClick={submit} disabled={!canSubmit}>
          {isPending ? "A guardar..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
