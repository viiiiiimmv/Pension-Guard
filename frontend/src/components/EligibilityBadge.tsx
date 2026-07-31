import type { CSSProperties } from "react";

interface EligibilityBadgeProps {
  value: number | null;
}

const pendingStyle: CSSProperties = {
  borderColor: "var(--theme-border)",
  backgroundColor: "var(--theme-surface-muted)",
  color: "var(--theme-text)",
};

const eligibleStyle: CSSProperties = {
  borderColor: "var(--theme-border)",
  backgroundColor: "var(--theme-surface-muted)",
  color: "var(--theme-text)",
};

const flaggedStyle: CSSProperties = {
  borderColor: "var(--theme-border)",
  backgroundColor: "var(--theme-surface-muted)",
  color: "var(--theme-text)",
};

export function EligibilityBadge({ value }: EligibilityBadgeProps) {
  if (value === null) {
    return (
      <span
        className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]"
        style={pendingStyle}
      >
        Pending
      </span>
    );
  }

  const isEligible = value === 1;
  return (
    <span
      className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]"
      style={isEligible ? eligibleStyle : flaggedStyle}
    >
      {isEligible ? "Eligible" : "Flagged"}
    </span>
  );
}
