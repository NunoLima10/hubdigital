import { authClient } from "@/lib/auth-client";
import {
  reportReasonLabels,
  reportReasonValues,
  type ReportReason,
  type ReportTarget,
} from "@hubdigital/shared";
import {
  Anchor,
  Button,
  Group,
  Modal,
  Radio,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { useCreateReport } from "../../hooks/use-create-report";

type ReportButtonProps = {
  targetType: ReportTarget;
  targetId: number | string;
  /** Rendered as the trigger; defaults to a small dimmed "Reportar" link. */
  label?: string;
  size?: "xs" | "sm";
};

/**
 * Without this, moderation depends on staff happening to read every thread.
 * Only signed-in accounts can report, so the count in the admin inbox means
 * something.
 */
export function ReportButton({
  targetType,
  targetId,
  label = "Reportar",
  size = "xs",
}: ReportButtonProps) {
  const { data: session } = authClient.useSession();
  const [opened, modal] = useDisclosure(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");

  const { mutate, isPending } = useCreateReport({
    onSuccess: () => {
      modal.close();
      setDetails("");
      setReason("spam");
    },
  });

  if (!session) return null;

  return (
    <>
      <Anchor
        component="button"
        type="button"
        size={size}
        c="dimmed"
        onClick={modal.open}
      >
        {label}
      </Anchor>

      <Modal
        opened={opened}
        onClose={modal.close}
        title="Reportar à equipa"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            A equipa recebe este relatório e decide o que fazer. O autor não
            sabe quem reportou.
          </Text>

          <Radio.Group
            value={reason}
            onChange={(value) => setReason(value as ReportReason)}
          >
            <Stack gap="xs">
              {reportReasonValues.map((value) => (
                <Radio
                  key={value}
                  value={value}
                  label={reportReasonLabels[value]}
                />
              ))}
            </Stack>
          </Radio.Group>

          <Textarea
            label="Detalhes (opcional)"
            placeholder="O que devemos saber?"
            autosize
            minRows={2}
            maxLength={1000}
            value={details}
            onChange={(event) => setDetails(event.currentTarget.value)}
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={modal.close}>
              Cancelar
            </Button>
            <Button
              loading={isPending}
              onClick={() =>
                mutate({
                  targetType,
                  targetId: String(targetId),
                  reason,
                  details: details.trim() || undefined,
                })
              }
            >
              Enviar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
