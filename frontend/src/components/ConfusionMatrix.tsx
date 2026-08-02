import type { ConfusionMatrixResponse } from "../types";

interface ConfusionMatrixProps {
  matrix: ConfusionMatrixResponse;
}

const cells: Array<{
  label: string;
  valueKey: "tp" | "tn" | "fp" | "fn";
  accent: string;
}> = [
  {
    label: "True Positive",
    valueKey: "tp",
    accent: "var(--theme-danger)",
  },
  {
    label: "False Negative",
    valueKey: "fn",
    accent: "var(--theme-warning)",
  },
  {
    label: "False Positive",
    valueKey: "fp",
    accent: "#60a5fa",
  },
  {
    label: "True Negative",
    valueKey: "tn",
    accent: "var(--theme-success)",
  },
];

export function ConfusionMatrix({ matrix }: ConfusionMatrixProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cells.map((cell) => (
        <div key={cell.label} className="theme-card-soft border p-6">
          <div className="mb-5 h-1 w-12" style={{ backgroundColor: cell.accent }} />
          <p className="text-xs uppercase" style={{ color: "var(--theme-soft)" }}>{cell.label}</p>
          <p className="mt-4 font-mono text-3xl font-semibold" style={{ color: "var(--theme-text)" }}>
            {matrix[cell.valueKey].toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
