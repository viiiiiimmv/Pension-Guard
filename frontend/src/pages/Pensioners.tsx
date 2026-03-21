import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchPensioner, fetchPensioners } from "../api/client";
import { EligibilityBadge } from "../components/EligibilityBadge";
import { PensionerTable } from "../components/PensionerTable";
import type { PensionerRecord, StatusFilter } from "../types";

export function Pensioners() {
  const [search, setSearch] = useState("");
  const [filterBy, setFilterBy] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"created_at" | "age" | "life_proof_delay" | "fraud_probability">(
    "created_at",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<PensionerRecord | null>(null);
  const deferredSearch = useDeferredValue(search);

  const pensionerQuery = useQuery({
    queryKey: ["pensioners", page, deferredSearch, filterBy, sortBy, sortOrder],
    queryFn: () =>
      fetchPensioners({
        page,
        page_size: 25,
        search: deferredSearch || undefined,
        filter_by: filterBy,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const selectedQuery = useQuery({
    queryKey: ["pensioner", selected?.pensioner_id],
    queryFn: () => fetchPensioner(selected!.pensioner_id),
    enabled: Boolean(selected?.pensioner_id),
  });

  const items = pensionerQuery.data?.items ?? [];
  const pagination = pensionerQuery.data?.pagination;
  const selectedRecord = selectedQuery.data ?? selected;
  const emptyState = useMemo(() => !pensionerQuery.isLoading && items.length === 0, [items.length, pensionerQuery.isLoading]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.45fr_0.7fr]">
      <div className="space-y-5">
        <div className="theme-card rounded-3xl border p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
                Review Queue
              </p>
              <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--theme-text)" }}>
                Searchable pensioner table
              </h2>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={search}
                onChange={(event) =>
                  startTransition(() => {
                    setSearch(event.target.value);
                    setPage(1);
                  })
                }
                placeholder="Search by pensioner ID"
                className="theme-input rounded-2xl border px-4 py-3 text-sm outline-none"
              />
              <select
                value={filterBy}
                onChange={(event) => {
                  setFilterBy(event.target.value as StatusFilter);
                  setPage(1);
                }}
                className="theme-input rounded-2xl border px-4 py-3 text-sm outline-none"
              >
                <option value="all">All</option>
                <option value="eligible">Eligible</option>
                <option value="flagged">Flagged</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {emptyState ? (
          <div className="theme-empty rounded-3xl border p-8">
            No pensioners matched the current search and filter combination.
          </div>
        ) : (
          <PensionerTable
            items={items}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSelect={setSelected}
            onSort={(column) => {
              if (sortBy === column) {
                setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
              } else {
                setSortBy(column);
                setSortOrder("desc");
              }
            }}
          />
        )}

        <div className="theme-card flex items-center justify-between rounded-3xl border px-5 py-4">
          <p className="text-sm" style={{ color: "var(--theme-muted)" }}>
            {pagination ? `Page ${pagination.page} of ${pagination.total_pages}` : "Loading pagination..."}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!pagination || pagination.page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="theme-outline-btn rounded-2xl border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!pagination || pagination.page >= pagination.total_pages}
              onClick={() => setPage((current) => current + 1)}
              className="theme-outline-btn rounded-2xl border px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <aside className="theme-card rounded-3xl border p-5">
        <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
          Record Detail
        </p>
        <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--theme-text)" }}>
          Inference side panel
        </h2>

        {!selectedRecord ? (
          <div className="theme-empty mt-8 rounded-3xl border border-dashed p-6 text-sm">
            Click any row to inspect the full pensioner record and its inference output.
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="theme-card-soft rounded-3xl border p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-lg" style={{ color: "var(--theme-text)" }}>
                  {selectedRecord.pensioner_id}
                </p>
                <EligibilityBadge value={selectedRecord.predicted_label} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div><p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--theme-soft)" }}>Age</p><p className="mt-1" style={{ color: "var(--theme-text)" }}>{selectedRecord.age.toFixed(0)}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--theme-soft)" }}>Delay</p><p className="mt-1" style={{ color: "var(--theme-text)" }}>{selectedRecord.life_proof_delay.toFixed(1)} days</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--theme-soft)" }}>Bank Activity</p><p className="mt-1" style={{ color: "var(--theme-text)" }}>{selectedRecord.bank_activity_count}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--theme-soft)" }}>Approval Rate</p><p className="mt-1" style={{ color: "var(--theme-text)" }}>{(selectedRecord.historical_approval_rate * 100).toFixed(1)}%</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--theme-soft)" }}>Biometric</p><p className="mt-1" style={{ color: "var(--theme-text)" }}>{selectedRecord.biometric_status}</p></div>
                <div><p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--theme-soft)" }}>Credit Anomaly</p><p className="mt-1" style={{ color: "var(--theme-text)" }}>{selectedRecord.pension_credit_anomaly}</p></div>
              </div>
            </div>

            <div className="theme-card-soft rounded-3xl border p-5">
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--theme-soft)" }}>
                Inference Snapshot
              </p>
              <div className="mt-4 grid gap-4">
                <div>
                  <p className="text-sm" style={{ color: "var(--theme-muted)" }}>Fraud Probability</p>
                  <p className="mt-1 text-2xl font-semibold" style={{ color: "var(--theme-text)" }}>
                    {selectedRecord.fraud_probability !== null
                      ? `${(selectedRecord.fraud_probability * 100).toFixed(1)}%`
                      : "N/A"}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm" style={{ color: "var(--theme-muted)" }}>Confidence</p>
                    <p className="mt-1" style={{ color: "var(--theme-text)" }}>{selectedRecord.confidence ?? "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: "var(--theme-muted)" }}>Inference Time</p>
                    <p className="mt-1" style={{ color: "var(--theme-text)" }}>
                      {selectedRecord.inference_time_ms !== null
                        ? `${selectedRecord.inference_time_ms.toFixed(3)} ms`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
