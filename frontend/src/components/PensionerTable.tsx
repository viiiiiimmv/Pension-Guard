import { ArrowDown, ArrowUp } from "lucide-react";

import type { PensionerRecord } from "../types";
import { EligibilityBadge } from "./EligibilityBadge";

interface PensionerTableProps {
  items: PensionerRecord[];
  sortBy: "created_at" | "age" | "life_proof_delay" | "fraud_probability";
  sortOrder: "asc" | "desc";
  onSort: (column: "created_at" | "age" | "life_proof_delay" | "fraud_probability") => void;
  onSelect: (item: PensionerRecord) => void;
}

const columns = [
  { key: "pensioner_id", label: "ID" },
  { key: "age", label: "Age" },
  { key: "life_proof_delay", label: "Life-Proof Delay" },
  { key: "bank_activity_count", label: "Bank Activity" },
  { key: "biometric_status", label: "Biometric" },
  { key: "historical_approval_rate", label: "Approval Rate" },
  { key: "predicted_label", label: "Eligibility" },
  { key: "fraud_probability", label: "Fraud Prob." },
];

export function PensionerTable({ items, sortBy, sortOrder, onSort, onSelect }: PensionerTableProps) {
  return (
    <div className="theme-table flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border">
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
        <table className="min-w-full">
          <thead className="theme-table-head">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="theme-table-head sticky top-0 z-10 px-5 py-4 text-left text-xs uppercase tracking-[0.24em]"
                >
                  {["age", "life_proof_delay", "fraud_probability"].includes(column.key) ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-left"
                      onClick={() =>
                        onSort(column.key as "age" | "life_proof_delay" | "fraud_probability")
                      }
                    >
                      {column.label}
                      {sortBy === column.key ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )
                      ) : null}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="theme-table-row cursor-pointer transition"
                onClick={() => onSelect(item)}
              >
                <td className="px-5 py-4 font-mono text-sm" style={{ color: "var(--theme-text)" }}>
                  {item.pensioner_id}
                </td>
                <td className="px-5 py-4 text-sm" style={{ color: "var(--theme-muted)" }}>
                  {item.age.toFixed(0)}
                </td>
                <td className="px-5 py-4 text-sm" style={{ color: "var(--theme-muted)" }}>
                  {item.life_proof_delay.toFixed(1)}
                </td>
                <td className="px-5 py-4 text-sm" style={{ color: "var(--theme-muted)" }}>
                  {item.bank_activity_count}
                </td>
                <td className="px-5 py-4 text-sm" style={{ color: "var(--theme-muted)" }}>
                  {item.biometric_status}
                </td>
                <td className="px-5 py-4 text-sm" style={{ color: "var(--theme-muted)" }}>
                  {(item.historical_approval_rate * 100).toFixed(1)}%
                </td>
                <td className="px-5 py-4">
                  <EligibilityBadge value={item.predicted_label} />
                </td>
                <td className="px-5 py-4 text-sm" style={{ color: "var(--theme-muted)" }}>
                  {item.fraud_probability !== null ? `${(item.fraud_probability * 100).toFixed(1)}%` : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
