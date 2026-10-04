import {
  Flex,
  Skeleton,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconEye,
  IconExternalLink,
  IconHeart,
  IconMessageCircle,
} from "@tabler/icons-react";
import type { StatsRange } from "@hubdigital/shared";
import { useState } from "react";
import { useMyProjectStats } from "../../hooks/use-my-project-stats";
import { computeDelta } from "../../utils/format";
import { ProjectStatsList } from "../project-stats-list/project-stats-list";
import { StatCard } from "../stat-card/stat-card";
import { TrafficChart } from "../traffic-chart/traffic-chart";

const rangeOptions: { value: StatsRange; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
];

export function MetricsView() {
  const [range, setRange] = useState<StatsRange>("30d");
  const { data, isLoading, isError } = useMyProjectStats(range);

  return (
    <Stack p="md" gap="lg">
      <Flex align="center" justify="space-between" wrap="wrap" gap="sm">
        <Title order={3}>Desempenho</Title>
        <SegmentedControl
          value={range}
          onChange={(value) => setRange(value as StatsRange)}
          data={rangeOptions}
        />
      </Flex>

      {isLoading && <MetricsSkeleton />}

      {isError && (
        <Stack align="center" py="xl">
          <Text c="dimmed">
            Não foi possível carregar as métricas. Tenta novamente mais tarde.
          </Text>
        </Stack>
      )}

      {data && data.projects.length === 0 && (
        <Stack align="center" py="xl">
          <Text c="dimmed">
            Ainda não tens projetos. Publica um para começares a ver métricas.
          </Text>
        </Stack>
      )}

      {data && data.projects.length > 0 && (
        <>
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
            <StatCard
              label="Visualizações"
              icon={<IconEye size={16} />}
              value={data.totals.views}
              delta={computeDelta(data.totals.views, data.previous.views)}
            />
            <StatCard
              label="Visitas ao site"
              icon={<IconExternalLink size={16} />}
              value={data.totals.visits}
              delta={computeDelta(data.totals.visits, data.previous.visits)}
            />
            <StatCard
              label="Votos"
              icon={<IconHeart size={16} />}
              value={data.totals.upvotes}
              delta={computeDelta(data.totals.upvotes, data.previous.upvotes)}
            />
            <StatCard
              label="Comentários"
              icon={<IconMessageCircle size={16} />}
              value={data.totals.comments}
              delta={computeDelta(data.totals.comments, data.previous.comments)}
            />
          </SimpleGrid>

          <TrafficChart series={data.series} />

          <Stack gap="xs">
            <Text fw={600}>Por projeto</Text>
            <ProjectStatsList projects={data.projects} />
          </Stack>
        </>
      )}
    </Stack>
  );
}

function MetricsSkeleton() {
  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
        <Skeleton h={110} radius="md" />
        <Skeleton h={110} radius="md" />
        <Skeleton h={110} radius="md" />
        <Skeleton h={110} radius="md" />
      </SimpleGrid>
      <Skeleton h={320} radius="md" />
    </Stack>
  );
}
