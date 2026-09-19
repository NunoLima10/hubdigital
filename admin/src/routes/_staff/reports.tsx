import { fetchReports, resolveReports } from "@/api/admin";
import { PageHeader } from "@/components/page-header/page-header";
import { relativeTime } from "@/utils/relative-time";
import { reportReasonLabels, type ReportGroup } from "@hubdigital/shared";
import {
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconCheck, IconFlag, IconX } from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_staff/reports")({
  component: RouteComponent,
});

const targetLabels: Record<string, string> = {
  project: "Projeto",
  comment: "Comentário",
  user: "Conta",
};

function RouteComponent() {
  const [status, setStatus] = useState("open");
  const queryKey = ["admin", "reports", status];

  const { data, isPending } = useQuery({
    queryKey,
    queryFn: () => fetchReports(status ? (status as never) : undefined),
  });

  const resolve = useMutation({
    mutationFn: ({
      group,
      outcome,
    }: {
      group: ReportGroup;
      outcome: "resolved" | "dismissed";
    }) => resolveReports(group.targetType, group.targetId, outcome),
    meta: {
      invalidatesQuery: queryKey,
      successMessage: "Relatórios fechados.",
      errorMessage: "Não foi possível fechar os relatórios.",
    },
  });

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Agrupados por alvo: cinco denúncias sobre o mesmo comentário são uma coisa para ver, não cinco."
        action={
          <SegmentedControl
            value={status}
            onChange={setStatus}
            data={[
              { value: "open", label: "Por resolver" },
              { value: "resolved", label: "Resolvidos" },
              { value: "", label: "Todos" },
            ]}
          />
        }
      />

      {isPending ? (
        <Loader />
      ) : data && data.length > 0 ? (
        <Stack gap="sm">
          {data.map((group) => (
            <Card key={`${group.targetType}:${group.targetId}`} withBorder padding="md">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={6}>
                  <Group gap="xs">
                    <Badge variant="light">
                      {targetLabels[group.targetType] ?? group.targetType}
                    </Badge>
                    <Text size="sm" fw={500}>
                      {group.reportCount} relatório
                      {group.reportCount === 1 ? "" : "s"}
                    </Text>
                    {group.openCount > 0 && (
                      <Badge color="red" variant="light" size="sm">
                        {group.openCount} por resolver
                      </Badge>
                    )}
                  </Group>

                  <Group gap={4}>
                    {group.reasons.map((reason) => (
                      <Badge key={reason} size="xs" variant="outline">
                        {reportReasonLabels[reason]}
                      </Badge>
                    ))}
                  </Group>

                  {group.targetLabel && (
                    <Text size="sm" lineClamp={2}>
                      {group.targetHref ? (
                        <Anchor
                          component={Link}
                          to={group.targetHref}
                          size="sm"
                        >
                          {group.targetLabel}
                        </Anchor>
                      ) : (
                        group.targetLabel
                      )}
                    </Text>
                  )}

                  {group.latestDetails && (
                    <Text size="sm" c="dimmed" fs="italic">
                      «{group.latestDetails}»
                    </Text>
                  )}

                  <Text size="xs" c="dimmed">
                    Mais recente {relativeTime(group.latestAt)}
                  </Text>
                </Stack>

                {group.openCount > 0 && (
                  <Group gap="xs" wrap="nowrap">
                    <Button
                      size="xs"
                      variant="default"
                      leftSection={<IconX size={14} />}
                      loading={resolve.isPending}
                      onClick={() =>
                        resolve.mutate({ group, outcome: "dismissed" })
                      }
                    >
                      Descartar
                    </Button>
                    <Button
                      size="xs"
                      leftSection={<IconCheck size={14} />}
                      loading={resolve.isPending}
                      onClick={() =>
                        resolve.mutate({ group, outcome: "resolved" })
                      }
                    >
                      Resolver
                    </Button>
                  </Group>
                )}
              </Group>
            </Card>
          ))}
        </Stack>
      ) : (
        <Card withBorder padding="xl">
          <Stack align="center" gap="xs">
            <IconFlag size={32} />
            <Title order={5}>Nada por resolver</Title>
            <Text size="sm" c="dimmed" ta="center">
              As denúncias submetidas no site aparecem aqui.
            </Text>
          </Stack>
        </Card>
      )}
    </>
  );
}
