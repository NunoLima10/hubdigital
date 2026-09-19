import { fetchSettings, patchSettings } from "@/api/admin";
import { PageHeader } from "@/components/page-header/page-header";
import type { SettingsPatch } from "@hubdigital/shared";
import {
  Alert,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Stack,
  Switch,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_staff/settings")({
  component: RouteComponent,
});

const SETTINGS_KEY = ["admin", "settings"];

function RouteComponent() {
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: fetchSettings,
  });

  const mutation = useMutation({
    mutationFn: (patch: SettingsPatch) => patchSettings(patch),
    meta: {
      invalidatesQuery: SETTINGS_KEY,
      successMessage: "Definições atualizadas.",
      errorMessage: "Não foi possível guardar as definições.",
    },
  });

  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (data) setAnnouncement(data.data["announcement.text"] ?? "");
  }, [data]);

  if (isPending || !data) return <Loader />;

  const settings = data.data;
  const reviewOn = settings["moderation.review_required"];

  function update(patch: SettingsPatch) {
    mutation.mutate(patch);
    queryClient.setQueryData(SETTINGS_KEY, (previous: typeof data) =>
      previous ? { ...previous, data: { ...previous.data, ...patch } } : previous
    );
  }

  return (
    <>
      <PageHeader
        title="Definições"
        description="Configuração da plataforma. As alterações têm efeito imediato, sem nova publicação."
      />

      <Stack gap="lg" maw={720}>
        <Card withBorder padding="lg">
          <Stack gap="md">
            <Title order={5}>Moderação</Title>

            <Alert
              variant="light"
              color={reviewOn ? "yellow" : "gray"}
              icon={<IconAlertTriangle size={18} />}
            >
              {reviewOn
                ? `A revisão está ativa: cada publicação passa pela fila. ${data.meta.pendingCount} projeto(s) à espera agora.`
                : `A revisão está desativada: os projetos são publicados diretamente pelos seus autores. Ativá-la afeta todos os projetos — as próximas publicações passam a esperar por si, incluindo os ${data.meta.draftCount} rascunho(s) existentes quando forem publicados.`}
            </Alert>

            <Switch
              checked={reviewOn}
              onChange={(event) =>
                update({
                  "moderation.review_required": event.currentTarget.checked,
                })
              }
              label="Exigir revisão antes de publicar"
              description="Uma publicação entra em «Em revisão» em vez de ir diretamente para o site."
            />

            <Divider />

            <Switch
              checked={settings["moderation.auto_approve_trusted"]}
              onChange={(event) =>
                update({
                  "moderation.auto_approve_trusted":
                    event.currentTarget.checked,
                })
              }
              label="Makers de confiança não passam pela fila"
              description="Só tem efeito enquanto a revisão estiver ativa."
            />
          </Stack>
        </Card>

        <Card withBorder padding="lg">
          <Stack gap="md">
            <Title order={5}>Submissões</Title>

            <Switch
              checked={settings["submissions.open"]}
              onChange={(event) =>
                update({ "submissions.open": event.currentTarget.checked })
              }
              label="Aceitar novas submissões"
              description="Desativar mostra uma mensagem de manutenção no formulário de submissão."
            />
          </Stack>
        </Card>

        <Card withBorder padding="lg">
          <Stack gap="md">
            <Title order={5}>Anúncio</Title>
            <Text size="sm" c="dimmed">
              Aparece no topo do site público. Deixe vazio para não mostrar nada.
            </Text>

            <Textarea
              value={announcement}
              onChange={(event) => setAnnouncement(event.currentTarget.value)}
              maxLength={280}
              autosize
              minRows={2}
              placeholder="Ex.: O ranking desta semana fecha domingo às 23h59."
            />

            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                {announcement.length}/280
              </Text>
              <Button
                loading={mutation.isPending}
                disabled={
                  (announcement.trim() || null) ===
                  (settings["announcement.text"] ?? null)
                }
                onClick={() =>
                  update({ "announcement.text": announcement.trim() || null })
                }
              >
                Guardar anúncio
              </Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </>
  );
}
