import type { CSSProperties, ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  accent: "signal" | "safe" | "danger" | "sand";
  icon: ReactNode;
}

const accentMap: Record<StatCardProps["accent"], CSSProperties> = {
  signal: {
    borderColor: "var(--theme-accent-border)",
    backgroundColor: "var(--theme-accent-soft)",
    color: "var(--theme-accent)",
  },
  safe: {
    borderColor: "var(--theme-success-border)",
    backgroundColor: "var(--theme-success-soft)",
    color: "var(--theme-success)",
  },
  danger: {
    borderColor: "var(--theme-danger-border)",
    backgroundColor: "var(--theme-danger-soft)",
    color: "var(--theme-danger)",
  },
  sand: {
    borderColor: "var(--theme-warning-border)",
    backgroundColor: "var(--theme-warning-soft)",
    color: "var(--theme-warning)",
  },
};

export function StatCard({ title, value, subtitle, accent, icon }: StatCardProps) {
  return (
    <div className="theme-panel rounded-3xl border p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.32em]" style={{ color: "var(--theme-soft)" }}>
            {title}
          </p>
          <p className="mt-3 text-3xl font-semibold" style={{ color: "var(--theme-text)" }}>
            {value}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border" style={accentMap[accent]}>
          {icon}
        </div>
      </div>
      <p className="text-sm" style={{ color: "var(--theme-muted)" }}>
        {subtitle}
      </p>
    </div>
  );
}
