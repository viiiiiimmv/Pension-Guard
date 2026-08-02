import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MetricRow } from "../types";

interface ModelComparisonProps {
  rows: MetricRow[];
}

export function ModelComparison({ rows }: ModelComparisonProps) {
  const chartRows = rows.map((row) => ({
    model: row.model.replace(" System", ""),
    Accuracy: +(row.accuracy * 100).toFixed(1),
    Precision: +(row.precision * 100).toFixed(1),
    Recall: +(row.recall * 100).toFixed(1),
    F1: +(row.f1 * 100).toFixed(1),
  }));

  return (
    <div className="theme-card border p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase" style={{ color: "var(--theme-soft)" }}>
            Model Comparison
          </p>
          <h3 className="mt-2 text-xl font-semibold" style={{ color: "var(--theme-text)" }}>
            Benchmarking model performance
          </h3>
        </div>
      </div>
      <div className="h-[260px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartRows} barGap={8}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis dataKey="model" stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--chart-tooltip-bg)", borderRadius: 16, borderColor: "var(--chart-tooltip-border)" }}
              labelStyle={{ color: "var(--theme-text)" }}
              itemStyle={{ color: "var(--theme-text)" }}
            />
            <Legend />
            <Bar dataKey="Accuracy" fill="#f5f5f5" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Precision" fill="#22c55e" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Recall" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            <Bar dataKey="F1" fill="#ef4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
