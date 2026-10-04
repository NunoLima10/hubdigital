import type { ProjectStats } from "@hubdigital/shared";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDay } from "../../utils/format";

export function TrafficChart({ series }: { series: ProjectStats["series"] }) {
  const data = series.map((point) => ({
    day: formatDay(point.day),
    views: point.views,
    visits: point.visits,
  }));
  const empty = series.every(
    (point) => point.views === 0 && point.visits === 0,
  );
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-4 text-sm font-semibold">Visualizações e visitas</h2>
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tick={{ fontSize: 11 }}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
            />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="views"
              name="Visualizações"
              stroke="var(--primary)"
              fill="var(--primary)"
              fillOpacity={0.12}
            />
            <Area
              type="monotone"
              dataKey="visits"
              name="Visitas"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {empty && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Ainda sem visualizações neste período.
        </p>
      )}
    </div>
  );
}
