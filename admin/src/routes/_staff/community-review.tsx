import { useState } from "react";
import { API } from "@/api/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, Group, Stack, Text, Textarea, Title } from "@mantine/core";
import { PageHeader } from "@/components/page-header/page-header";
import { ProjectReviewPanel } from "@/modules/queue/components/project-review-panel/project-review-panel";
import { announcementKindLabels, type AdminProject, type Announcement } from "@hubdigital/shared";
export const Route = createFileRoute("/_staff/community-review")({ component: CommunityReview });
type Queue = {
  announcements: {
    announcement: Pick<Announcement, "id" | "kind" | "introduction">;
    name: string;
  }[];
  revisions: {
    id: number;
    projectId: number;
    project: AdminProject | null;
    proposed: AdminProject | null;
  }[];
};
function ReviewActions({ kind, id }: { kind: "announcements" | "revisions"; id: number }) {
  const [reason, setReason] = useState("");
  const cache = useQueryClient();
  const review = useMutation({
    mutationFn: async (approve: boolean) =>
      API.post(`/admin/community-review/${kind}/${id}`, {
        approve,
        reason: approve ? undefined : reason,
      }),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["community-review"] });
      cache.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
  });
  return (
    <Stack gap="xs">
      <Textarea
        label="Motivo da rejeição"
        value={reason}
        maxLength={1000}
        onChange={(event) => setReason(event.currentTarget.value)}
      />
      <Group>
        <Button loading={review.isPending} onClick={() => review.mutate(true)}>
          Aprovar
        </Button>
        <Button
          color="red"
          variant="light"
          disabled={reason.trim().length < 10 || review.isPending}
          onClick={() => review.mutate(false)}
        >
          Rejeitar
        </Button>
      </Group>
      {review.isError && (
        <Text size="sm" c="red">
          Não foi possível concluir. A proposta pode ter mudado; atualiza a fila.
        </Text>
      )}
    </Stack>
  );
}
function CommunityReview() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["community-review"],
    queryFn: async () => (await API.get<{ data: Queue }>("/admin/community-review")).data.data,
  });
  return (
    <Stack>
      <PageHeader title="Anúncios e alterações" />
      <Button variant="light" onClick={() => void refetch()}>
        Atualizar fila
      </Button>
      {isLoading && <Text>A carregar revisão…</Text>}
      {isError && <Text c="red">Não foi possível carregar a fila.</Text>}
      {data && !data.announcements.length && !data.revisions.length && (
        <Text c="dimmed">Nenhum anúncio ou alteração pendente.</Text>
      )}
      {data?.announcements.map(({ announcement, name }) => (
        <Card key={`a-${announcement.id}`} withBorder>
          <Stack>
            <Title order={3}>
              {name} · {announcementKindLabels[announcement.kind]}
            </Title>
            <Text style={{ whiteSpace: "pre-wrap" }}>{announcement.introduction}</Text>
            <Text size="xs" c="dimmed">
              Ao aprovar, o anúncio entra na semana atual de Cabo Verde.
            </Text>
            <ReviewActions kind="announcements" id={announcement.id} />
          </Stack>
        </Card>
      ))}
      {data?.revisions.map((revision) => (
        <Card key={`r-${revision.id}`} withBorder>
          <Stack>
            <Title order={3}>Alterações: {revision.project?.name}</Title>
            <details>
              <summary>Versão pública atual</summary>
              {revision.project && <ProjectReviewPanel project={revision.project} />}
            </details>
            <Title order={4}>Proposta</Title>
            {revision.proposed && <ProjectReviewPanel project={revision.proposed} />}
            <ReviewActions kind="revisions" id={revision.id} />
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
