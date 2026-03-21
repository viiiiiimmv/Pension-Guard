import type { CSSProperties } from "react";

import type { ConfusionMatrixResponse } from "../types";

interface ConfusionMatrixProps {
  matrix: ConfusionMatrixResponse;
}

const cells: Array<{
  label: string;
  valueKey: "tp" | "tn" | "fp" | "fn";
  tone: CSSProperties;
}> = [
  {
    label: "True Positive",
    valueKey: "tp",
    tone: {
      borderColor: "var(--theme-danger-border)",
      backgroundColor: "var(--theme-danger-soft)",
      color: "var(--theme-danger)",
    },
  },
  {
    label: "False Negative",
    valueKey: "fn",
    tone: {
      borderColor: "var(--theme-warning-border)",
      backgroundColor: "var(--theme-warning-soft)",
      color: "var(--theme-warning)",
    },
  },
  {
    label: "False Positive",
    valueKey: "fp",
    tone: {
      borderColor: "var(--theme-accent-border)",
      backgroundColor: "var(--theme-accent-soft)",
      color: "var(--theme-accent)",
    },
  },
  {
    label: "True Negative",
    valueKey: "tn",
    tone: {
      borderColor: "var(--theme-success-border)",
      backgroundColor: "var(--theme-success-soft)",
      color: "var(--theme-success)",
    },
  },
];

export function ConfusionMatrix({ matrix }: ConfusionMatrixProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cells.map((cell) => (
        <div key={cell.label} className="rounded-3xl border p-6" style={cell.tone}>
          <p className="text-xs uppercase tracking-[0.28em]">{cell.label}</p>
          <p className="mt-4 font-mono text-3xl font-semibold" style={{ color: "var(--theme-text)" }}>
            {matrix[cell.valueKey].toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
