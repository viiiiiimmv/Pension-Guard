import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  fetchConfusion,
  fetchFeatures,
  fetchMetrics,
  fetchProtectedReportAsset,
} from "../api/client";
import { ConfusionMatrix } from "../components/ConfusionMatrix";

export function Analytics() {
  const confusionQuery = useQuery({ queryKey: ["confusion"], queryFn: fetchConfusion });
  const featureQuery = useQuery({ queryKey: ["feature-importance"], queryFn: fetchFeatures });
  const metricsQuery = useQuery({ queryKey: ["metrics"], queryFn: fetchMetrics });
  const rocReportQuery = useQuery({
    queryKey: ["report", "roc_curve.png"],
    queryFn: () => fetchProtectedReportAsset("roc_curve.png"),
  });
  const [rocCurveUrl, setRocCurveUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!rocReportQuery.data) {
      setRocCurveUrl(null);
      return;
    }

    const url = URL.createObjectURL(rocReportQuery.data);
    setRocCurveUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [rocReportQuery.data]);

  if (confusionQuery.isLoading || featureQuery.isLoading || metricsQuery.isLoading || rocReportQuery.isLoading) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="theme-card rounded-3xl border h-44 animate-pulse" />
        ))}
      </div>
    );
  }

  const confusion = confusionQuery.data;
  const features = featureQuery.data;
  const metrics = metricsQuery.data;

  if (!confusion || !features || !metrics) {
    return (
      <div
        className="rounded-3xl border p-6"
        style={{
          borderColor: "var(--theme-danger-border)",
          backgroundColor: "var(--theme-danger-soft)",
          color: "var(--theme-danger)",
        }}
      >
        Unable to load analytics reports.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="theme-card rounded-3xl border p-5">
          <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
            Confusion Matrix
          </p>
          <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--theme-text)" }}>
            Operational fraud detection outcomes
          </h2>
          <div className="mt-6">
            <ConfusionMatrix matrix={confusion} />
          </div>
        </div>

        <div className="theme-card rounded-3xl border p-5">
          <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
            Model Reports
          </p>
          <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--theme-text)" }}>
            ROC curve artifact
          </h2>
          <div className="theme-card-soft mt-6 overflow-hidden rounded-3xl border p-3">
            {rocCurveUrl ? (
              <img
                src={rocCurveUrl}
                alt="ROC Curve"
                className="w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed" style={{ borderColor: "var(--theme-border)", color: "var(--theme-muted)" }}>
                ROC curve is not available.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="theme-card rounded-3xl border p-5">
          <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
            Feature Importance
          </p>
          <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--theme-text)" }}>
            Top contributing variables
          </h2>
          <div className="mt-6 space-y-4">
            {features.map((feature) => (
              <div key={feature.feature}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm" style={{ color: "var(--theme-text)" }}>{feature.label}</p>
                  <span className="font-mono text-xs" style={{ color: "var(--theme-soft)" }}>
                    {feature.importance.toFixed(4)}
                  </span>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: "var(--theme-border)" }}>
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.max(feature.importance * 100, 6)}%`,
                      background: "linear-gradient(90deg, var(--theme-accent), var(--theme-success), var(--theme-warning))",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="theme-card rounded-3xl border p-5">
          <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
            Benchmark Table
          </p>
          <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--theme-text)" }}>
            Performance metrics
          </h2>
          <div className="theme-table mt-6 overflow-hidden rounded-3xl border">
            <table className="min-w-full">
              <thead className="theme-table-head">
                <tr>
                  {["Model", "Acc", "Prec", "Rec", "F1", "ROC AUC"].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-4 text-left text-xs uppercase tracking-[0.24em]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.performance_comparison.map((row) => (
                  <tr key={row.model} className="theme-table-row">
                    <td className="px-4 py-4 text-sm" style={{ color: "var(--theme-text)" }}>{row.model}</td>
                    <td className="px-4 py-4 font-mono text-sm" style={{ color: "var(--theme-muted)" }}>{(row.accuracy * 100).toFixed(1)}%</td>
                    <td className="px-4 py-4 font-mono text-sm" style={{ color: "var(--theme-muted)" }}>{(row.precision * 100).toFixed(1)}%</td>
                    <td className="px-4 py-4 font-mono text-sm" style={{ color: "var(--theme-muted)" }}>{(row.recall * 100).toFixed(1)}%</td>
                    <td className="px-4 py-4 font-mono text-sm" style={{ color: "var(--theme-muted)" }}>{(row.f1 * 100).toFixed(1)}%</td>
                    <td className="px-4 py-4 font-mono text-sm" style={{ color: "var(--theme-muted)" }}>
                      {row.roc_auc ? row.roc_auc.toFixed(3) : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="theme-card-soft mt-5 rounded-3xl border p-4">
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--theme-soft)" }}>
              Latency Benchmark
            </p>
            <p className="mt-2 text-xl" style={{ color: "var(--theme-text)" }}>
              Mean {metrics.latency_benchmark_ms.mean_ms?.toFixed?.(3) ?? metrics.latency_benchmark_ms.mean_ms} ms
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
