import { COMMENT_MAX_LENGTH } from "@hubdigital/shared";
import { Button, Flex, Stack, Textarea } from "@mantine/core";
import { useState } from "react";

type CommentComposerProps = {
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
}: CommentComposerProps) {
  const [body, setBody] = useState(initialValue);

  const trimmed = body.trim();
  const isTooLong = trimmed.length > COMMENT_MAX_LENGTH;
  const canSubmit = trimmed.length > 0 && !isTooLong && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;

    onSubmit(trimmed);
    setBody("");
  }

  return (
    <Stack gap="xs">
      <Textarea
        value={body}
        onChange={(event) => setBody(event.currentTarget.value)}
        placeholder={placeholder}
        autosize
        minRows={2}
        maxRows={8}
        autoFocus={autoFocus}
        error={
          isTooLong
            ? `Máximo de ${COMMENT_MAX_LENGTH} caracteres.`
            : undefined
        }
      />
      <Flex justify="flex-end" gap="xs">
        {onCancel && (
          <Button variant="default" size="xs" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
        )}
        <Button size="xs" onClick={handleSubmit} disabled={!canSubmit} loading={isPending}>
          {submitLabel}
        </Button>
      </Flex>
    </Stack>
  );
}
