import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  ShieldCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
  CartesianGrid,
} from "recharts";

import { fetchDistribution, fetchMetrics, fetchSummary } from "../api/client";
import { ModelComparison } from "../components/ModelComparison";
import { StatCard } from "../components/StatCard";

const piePalette = ["var(--theme-success)", "var(--theme-danger)", "var(--theme-warning)"];

export function Dashboard() {
  const summaryQuery = useQuery({ queryKey: ["summary"], queryFn: fetchSummary });
  const metricsQuery = useQuery({ queryKey: ["metrics"], queryFn: fetchMetrics });
  const distributionQuery = useQuery({ queryKey: ["distribution"], queryFn: fetchDistribution });

  if (summaryQuery.isLoading || metricsQuery.isLoading || distributionQuery.isLoading) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="theme-card rounded-3xl border h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  const summary = summaryQuery.data;
  const metrics = metricsQuery.data;
  const distribution = distributionQuery.data;

  if (!summary || !metrics || !distribution) {
    return (
      <div
        className="rounded-3xl border p-6"
        style={{
          borderColor: "var(--theme-danger-border)",
          backgroundColor: "var(--theme-danger-soft)",
          color: "var(--theme-danger)",
        }}
      >
        Unable to load dashboard analytics.
      </div>
    );
  }

  const pieData = [
    { name: "Eligible", value: summary.eligible_count },
    { name: "Flagged", value: summary.fraud_count },
    { name: "Pending", value: summary.pending_count },
  ];

  const ageData = distribution.age.counts.map((count, index) => ({
    range: `${distribution.age.edges[index].toFixed(0)}-${distribution.age.edges[index + 1].toFixed(0)}`,
    count,
  }));
  const delayData = distribution.life_proof_delay.counts.map((count, index) => ({
    range: `${distribution.life_proof_delay.edges[index].toFixed(0)}-${distribution.life_proof_delay.edges[index + 1].toFixed(0)}`,
    count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Pensioners"
          value={summary.total.toLocaleString()}
          subtitle="Operational record count in the review pool."
          accent="signal"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <StatCard
          title="Eligible"
          value={summary.eligible_count.toLocaleString()}
          subtitle="Records currently clearing verification rules."
          accent="safe"
          icon={<BadgeCheck className="h-5 w-5" />}
        />
        <StatCard
          title="Flagged"
          value={summary.fraud_count.toLocaleString()}
          subtitle="Cases requiring manual review or intervention."
          accent="danger"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          title="Avg. Fraud Prob."
          value={`${(summary.avg_fraud_probability * 100).toFixed(1)}%`}
          subtitle={`Fraud rate ${(summary.fraud_rate * 100).toFixed(1)}% across active records.`}
          accent="sand"
          icon={<Activity className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <ModelComparison rows={metrics.performance_comparison} />
        <div className="theme-card rounded-3xl border p-5">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
              Eligibility Mix
            </p>
            <h3 className="mt-2 text-xl font-semibold" style={{ color: "var(--theme-text)" }}>
              Eligible vs flagged distribution
            </h3>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={68} outerRadius={108} paddingAngle={6}>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={piePalette[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--chart-tooltip-bg)", borderRadius: 18, borderColor: "var(--chart-tooltip-border)" }}
                  labelStyle={{ color: "var(--theme-text)" }}
                  itemStyle={{ color: "var(--theme-text)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {pieData.map((item, index) => (
              <div key={item.name} className="theme-card-soft rounded-2xl border p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: piePalette[index] }} />
                  <p className="text-sm" style={{ color: "var(--theme-muted)" }}>
                    {item.name}
                  </p>
                </div>
                <p className="mt-2 font-mono text-xl" style={{ color: "var(--theme-text)" }}>
                  {item.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="theme-card rounded-3xl border p-5">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
              Age Distribution
            </p>
            <h3 className="mt-2 text-xl font-semibold" style={{ color: "var(--theme-text)" }}>
              Histogram of pensioner age bands
            </h3>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="range" stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--chart-tooltip-bg)", borderRadius: 18, borderColor: "var(--chart-tooltip-border)" }}
                  labelStyle={{ color: "var(--theme-text)" }}
                  itemStyle={{ color: "var(--theme-text)" }}
                />
                <Bar dataKey="count" fill="var(--theme-accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="theme-card rounded-3xl border p-5">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
              Life-Proof Delay
            </p>
            <h3 className="mt-2 text-xl font-semibold" style={{ color: "var(--theme-text)" }}>
              Delay trend across verification buckets
            </h3>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={delayData}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                <XAxis dataKey="range" stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--chart-tooltip-bg)", borderRadius: 18, borderColor: "var(--chart-tooltip-border)" }}
                  labelStyle={{ color: "var(--theme-text)" }}
                  itemStyle={{ color: "var(--theme-text)" }}
                />
                <Line type="monotone" dataKey="count" stroke="var(--theme-success)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
