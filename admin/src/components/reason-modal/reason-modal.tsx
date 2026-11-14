import { MODERATION_REASON_MIN } from "@hubdigital/shared";
import { Alert, Button, Group, Modal, Stack, Textarea } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { ReactNode, useEffect, useState } from "react";

type ReasonModalProps = {
  opened: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  /** Shown above the field: what this action will do, in plain words. */
  description: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  /** Set when the person on the receiving end will read the text verbatim. */
  visibleToTarget?: boolean;
};

/**
 * Every sanction goes through here, because every sanction needs a written
 * reason: it is stored in the audit log, and in most cases shown to the person
 * it was applied to.
 */
export function ReasonModal({
  opened,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  danger,
  loading,
  visibleToTarget,
}: ReasonModalProps) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (opened) {
      setReason("");
      setTouched(false);
    }
  }, [opened]);

  const tooShort = reason.trim().length < MODERATION_REASON_MIN;

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered>
      <Stack gap="md">
        <Alert
          variant="light"
          color={danger ? "red" : "blue"}
          icon={<IconAlertTriangle size={18} />}
        >
          {description}
        </Alert>

        <Textarea
          label="Motivo"
          description={
            visibleToTarget
              ? "Este texto será mostrado à pessoa afetada."
              : "Fica registado no histórico de auditoria."
          }
          placeholder="Explique o que motivou esta decisão."
          minRows={4}
          autosize
          value={reason}
          onChange={(event) => setReason(event.currentTarget.value)}
          onBlur={() => setTouched(true)}
          error={
            touched && tooShort
              ? `Escreva pelo menos ${MODERATION_REASON_MIN} caracteres.`
              : null
          }
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            color={danger ? "red" : undefined}
            disabled={tooShort}
            loading={loading}
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
