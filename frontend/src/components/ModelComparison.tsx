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
    <div className="theme-card rounded-3xl border p-5">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
          Model Comparison
        </p>
        <h3 className="mt-2 text-xl font-semibold" style={{ color: "var(--theme-text)" }}>
          Accuracy, Precision, Recall, F1
        </h3>
      </div>
      <div className="h-[250px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartRows}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis dataKey="model" stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "var(--chart-tooltip-bg)", borderRadius: 18, borderColor: "var(--chart-tooltip-border)" }}
              labelStyle={{ color: "var(--theme-text)" }}
              itemStyle={{ color: "var(--theme-text)" }}
            />
            <Legend />
            <Bar dataKey="Accuracy" fill="var(--theme-text)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Precision" fill="var(--theme-success)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Recall" fill="var(--theme-accent)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="F1" fill="var(--theme-danger)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
