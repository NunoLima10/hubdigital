import { fetchAudit, type AuditQuery } from "@/api/admin";
import { actionLabel } from "@/components/audit-history/audit-history";
import { PageHeader } from "@/components/page-header/page-header";
import { relativeTime } from "@/utils/relative-time";
import {
  moderationActionValues,
  moderationTargetValues,
} from "@hubdigital/shared";
import {
  Badge,
  Card,
  Code,
  Group,
  Loader,
  Pagination,
  Select,
  Table,
  Text,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_staff/audit")({
  component: RouteComponent,
});

const PAGE_SIZE = 25;

const rangeOptions = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "", label: "Desde sempre" },
];

/**
 * Rounded down to the hour, and memoised on `range` by the caller. Both matter:
 * a bound computed from `Date.now()` on every render changes the query key
 * every render, and React Query then refetches in a loop.
 */
function since(days: string) {
  if (!days) return undefined;

  const HOUR = 60 * 60 * 1000;
  const from = Date.now() - Number(days) * 24 * HOUR;

  return new Date(Math.floor(from / HOUR) * HOUR).toISOString();
}

function RouteComponent() {
  const [range, setRange] = useState("30");
  const [targetType, setTargetType] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);

  const from = useMemo(() => since(range), [range]);

  const query: AuditQuery = {
    from,
    targetType: (targetType || undefined) as AuditQuery["targetType"],
    action: action || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const { data, isPending } = useQuery({
    queryKey: ["admin", "audit", query],
    queryFn: () => fetchAudit(query),
  });

  const total = data?.meta.total ?? 0;

  return (
    <>
      <PageHeader
        title="Auditoria"
        description="Registo de todas as ações da equipa. Só de leitura — não existe forma de o alterar."
        action={
          <Text size="sm" c="dimmed">
            {total} registo{total === 1 ? "" : "s"}
          </Text>
        }
      />

      <Card withBorder padding="md" mb="md">
        <Group gap="sm" wrap="wrap">
          <Select
            data={rangeOptions}
            value={range}
            onChange={(value) => {
              setRange(value ?? "");
              setPage(1);
            }}
            w={180}
            allowDeselect={false}
          />
          <Select
            data={[
              { value: "", label: "Todos os alvos" },
              ...moderationTargetValues.map((target) => ({
                value: target,
                label: target,
              })),
            ]}
            value={targetType}
            onChange={(value) => {
              setTargetType(value ?? "");
              setPage(1);
            }}
            w={180}
            allowDeselect={false}
          />
          <Select
            searchable
            data={[
              { value: "", label: "Todas as ações" },
              ...moderationActionValues.map((value) => ({
                value,
                label: actionLabel(value),
              })),
            ]}
            value={action}
            onChange={(value) => {
              setAction(value ?? "");
              setPage(1);
            }}
            w={260}
            allowDeselect={false}
          />
        </Group>
      </Card>

      <Card withBorder padding={0}>
        {isPending ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : (
          <Table.ScrollContainer minWidth={720}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Quando</Table.Th>
                  <Table.Th>Quem</Table.Th>
                  <Table.Th>Ação</Table.Th>
                  <Table.Th>Alvo</Table.Th>
                  <Table.Th>Motivo</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data?.data.map((entry) => (
                  <Table.Tr key={entry.id}>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {relativeTime(entry.createdAt)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{entry.actor.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{actionLabel(entry.action)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Badge size="xs" variant="light">
                          {entry.targetType}
                        </Badge>
                        <Code>{entry.targetId}</Code>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {entry.reason ?? "—"}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {data?.data.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text size="sm" c="dimmed" ta="center" py="lg">
                        Nenhuma ação neste período.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Card>

      {total > PAGE_SIZE && (
        <Group justify="center" mt="md">
          <Pagination
            value={page}
            onChange={setPage}
            total={Math.ceil(total / PAGE_SIZE)}
          />
        </Group>
      )}
    </>
  );
}
