import { fetchStats } from "@/api/admin";
import { PageHeader } from "@/components/page-header/page-header";
import { relativeTime } from "@/utils/relative-time";
import {
  Alert,
  Card,
  Grid,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconClipboardCheck,
  IconEyeOff,
  IconFlag,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ReactNode } from "react";

export const Route = createFileRoute("/_staff/")({
  component: RouteComponent,
});

type Metric = { label: string; last: number; previous: number };

function Delta({ last, previous }: { last: number; previous: number }) {
  const diff = last - previous;

  if (diff === 0) {
    return (
      <Text size="xs" c="dimmed">
        sem alteração
      </Text>
    );
  }

  const up = diff > 0;

  return (
    <Group gap={4}>
      {up ? (
        <IconTrendingUp size={14} color="var(--mantine-color-teal-6)" />
      ) : (
        <IconTrendingDown size={14} color="var(--mantine-color-red-6)" />
      )}
      <Text size="xs" c={up ? "teal" : "red"}>
        {up ? "+" : ""}
        {diff} vs. 7 dias antes
      </Text>
    </Group>
  );
}

function AlertTile({
  icon,
  label,
  value,
  to,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  to: string;
  color: string;
}) {
  return (
    <Card
      withBorder
      padding="md"
      component={Link}
      to={to}
      style={{ textDecoration: "none" }}
    >
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon variant="light" color={color} size="lg">
          {icon}
        </ThemeIcon>
        <Stack gap={0}>
          <Title order={2}>{value}</Title>
          <Text size="sm" c="dimmed">
            {label}
          </Text>
        </Stack>
      </Group>
    </Card>
  );
}

function RouteComponent() {
  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchStats,
  });

  if (isPending) return <Loader />;

  if (error || !data) {
    return (
      <Alert color="red" variant="light">
        Não foi possível carregar as métricas.
      </Alert>
    );
  }

  const metrics: Metric[] = [
    { label: "Registos", last: data.last7.signups, previous: data.previous7.signups },
    {
      label: "Submissões",
      last: data.last7.submissions,
      previous: data.previous7.submissions,
    },
    {
      label: "Publicações",
      last: data.last7.publishes,
      previous: data.previous7.publishes,
    },
    {
      label: "Comentários",
      last: data.last7.comments,
      previous: data.previous7.comments,
    },
    { label: "Votos", last: data.last7.upvotes, previous: data.previous7.upvotes },
  ];

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Atividade dos últimos 7 dias, comparada com os 7 anteriores."
      />

      <Stack gap="xl">
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <AlertTile
            icon={<IconClipboardCheck size={20} />}
            label={
              data.queue.oldestQueuedAt
                ? `na fila · mais antigo ${relativeTime(data.queue.oldestQueuedAt)}`
                : "na fila de revisão"
            }
            value={data.queue.pending}
            to="/queue"
            color={data.queue.pending > 0 ? "yellow" : "gray"}
          />
          <AlertTile
            icon={<IconFlag size={20} />}
            label="relatórios por resolver"
            value={data.openReports}
            to="/reports"
            color={data.openReports > 0 ? "red" : "gray"}
          />
          <AlertTile
            icon={<IconEyeOff size={20} />}
            label="projetos e contas ocultados"
            value={data.hiddenProjects + data.hiddenUsers}
            to="/projects"
            color="orange"
          />
        </SimpleGrid>

        <Stack gap="sm">
          <Title order={5}>Últimos 7 dias</Title>
          <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="md">
            {metrics.map((metric) => (
              <Card key={metric.label} withBorder padding="md">
                <Stack gap={2}>
                  <Text size="sm" c="dimmed">
                    {metric.label}
                  </Text>
                  <Title order={3}>{metric.last}</Title>
                  <Delta last={metric.last} previous={metric.previous} />
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>

        <Stack gap="sm">
          <Title order={5}>Totais</Title>
          <Grid>
            {[
              { label: "Utilizadores", value: data.totals.users },
              { label: "Makers", value: data.totals.publishers },
              { label: "Projetos", value: data.totals.projects },
              { label: "Publicados", value: data.totals.published },
            ].map((total) => (
              <Grid.Col key={total.label} span={{ base: 6, sm: 3 }}>
                <Card withBorder padding="md">
                  <Text size="sm" c="dimmed">
                    {total.label}
                  </Text>
                  <Title order={3}>{total.value}</Title>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Stack>
      </Stack>
    </>
  );
}
