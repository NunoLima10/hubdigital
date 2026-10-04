import { AreaChart } from "@mantine/charts";
import { Paper, Stack, Text } from "@mantine/core";
import type { ProjectStats } from "@hubdigital/shared";
import { useMemo } from "react";
import { formatDay } from "../../utils/format";

type TrafficChartProps = {
  series: ProjectStats["series"];
};

export function TrafficChart({ series }: TrafficChartProps) {
  const data = useMemo(
    () =>
      series.map((point) => ({
        label: formatDay(point.day),
        Visualizações: point.views,
        Visitas: point.visits,
      })),
    [series]
  );

  const empty = series.every((point) => point.views === 0 && point.visits === 0);

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm">
        <Text fw={600}>Visualizações e visitas</Text>
        <AreaChart
          h={240}
          data={data}
          dataKey="label"
          series={[
            { name: "Visualizações", color: "blue.6" },
            { name: "Visitas", color: "teal.6" },
          ]}
          curveType="monotone"
          withDots={false}
          // Fewer ticks keep the axis readable at phone width; the tooltip
          // carries the exact day, and works on tap.
          tickLine="none"
          xAxisProps={{ interval: "preserveStartEnd", minTickGap: 24 }}
          yAxisProps={{ allowDecimals: false }}
          withLegend
          legendProps={{ verticalAlign: "bottom" }}
        />
        {empty && (
          <Text size="sm" c="dimmed" ta="center">
            Ainda sem visualizações neste período.
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
