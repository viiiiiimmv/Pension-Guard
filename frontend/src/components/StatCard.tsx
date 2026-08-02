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
    borderColor: "var(--theme-border)",
    backgroundColor: "var(--theme-surface-muted)",
    color: "var(--theme-text)",
  },
  safe: {
    borderColor: "var(--theme-border)",
    backgroundColor: "var(--theme-surface-muted)",
    color: "var(--theme-text)",
  },
  danger: {
    borderColor: "var(--theme-border)",
    backgroundColor: "var(--theme-surface-muted)",
    color: "var(--theme-text)",
  },
  sand: {
    borderColor: "var(--theme-border)",
    backgroundColor: "var(--theme-surface-muted)",
    color: "var(--theme-text)",
  },
};

export function StatCard({ title, value, subtitle, accent, icon }: StatCardProps) {
  return (
    <div className="theme-panel border p-5 transition duration-200 hover:-translate-y-0.5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase" style={{ color: "var(--theme-soft)" }}>
            {title}
          </p>
          <p className="mt-3 text-3xl font-semibold" style={{ color: "var(--theme-text)" }}>
            {value}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border" style={accentMap[accent]}>
          {icon}
        </div>
      </div>
      <p className="text-sm leading-6" style={{ color: "var(--theme-muted)" }}>
        {subtitle}
      </p>
    </div>
  );
}
