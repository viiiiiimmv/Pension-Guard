import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { predictSingle } from "../api/client";

const defaults = {
  age: 67,
  life_proof_delay: 18,
  bank_activity_count: 9,
  biometric_status: 1,
  historical_approval_rate: 0.84,
  pension_credit_anomaly: 0,
};

export function Predict() {
  const [formState, setFormState] = useState(defaults);

  const mutation = useMutation({
    mutationFn: predictSingle,
  });

  const riskPercent = useMemo(
    () => Math.round((mutation.data?.fraud_probability ?? 0) * 100),
    [mutation.data?.fraud_probability],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <form
        className="theme-card rounded-3xl border p-6"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(formState);
        }}
      >
        <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
          Single Record Inference
        </p>
        <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--theme-text)" }}>
          Eligibility prediction form
        </h2>
        <p className="mt-3 max-w-2xl text-sm" style={{ color: "var(--theme-muted)" }}>
          Submit one pensioner profile to inspect risk, confidence, inference time, and a feature-level breakdown.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            { key: "age", label: "Age", hint: "55-90" },
            { key: "life_proof_delay", label: "Life-Proof Delay", hint: "0-180 days" },
            { key: "bank_activity_count", label: "Bank Activity Count", hint: "0-30" },
            { key: "biometric_status", label: "Biometric Status", hint: "0 or 1" },
            { key: "historical_approval_rate", label: "Historical Approval Rate", hint: "0.0-1.0" },
            { key: "pension_credit_anomaly", label: "Pension Credit Anomaly", hint: "0 or 1" },
          ].map((field) => (
            <label key={field.key} className="theme-card-soft rounded-3xl border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "var(--theme-text)" }}>
                  {field.label}
                </span>
                <span className="text-xs uppercase tracking-[0.22em]" style={{ color: "var(--theme-soft)" }}>
                  {field.hint}
                </span>
              </div>
              <input
                type="number"
                step={field.key === "historical_approval_rate" ? "0.01" : "1"}
                value={formState[field.key as keyof typeof formState]}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    [field.key]: Number(event.target.value),
                  }))
                }
                className="theme-input mt-4 w-full rounded-2xl border px-4 py-3 outline-none"
              />
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="theme-primary-btn mt-8 rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? "Running prediction..." : "Submit for inference"}
        </button>
      </form>

      <section className="theme-card rounded-3xl border p-6">
        <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
          Inference Result
        </p>
        <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--theme-text)" }}>
          Decision card
        </h2>

        {!mutation.data ? (
          <div className="theme-empty mt-8 rounded-3xl border border-dashed p-6 text-sm">
            Run a prediction to see the eligibility status, fraud gauge, and feature contribution breakdown.
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            <div className="theme-card-soft rounded-[2rem] border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--theme-soft)" }}>
                    Decision
                  </p>
                  <p
                    className="mt-3 text-4xl font-semibold"
                    style={{ color: mutation.data.eligible ? "var(--theme-success)" : "var(--theme-danger)" }}
                  >
                    {mutation.data.eligible ? "Eligible" : "Flagged"}
                  </p>
                </div>
                <div
                  className="flex h-32 w-32 items-center justify-center rounded-full border"
                  style={{
                    borderColor: "var(--theme-border)",
                    background: "conic-gradient(var(--theme-danger), var(--theme-warning), var(--theme-success))",
                  }}
                >
                  <div
                    className="flex h-24 w-24 flex-col items-center justify-center rounded-full"
                    style={{ backgroundColor: "var(--theme-surface)" }}
                  >
                    <span className="font-mono text-2xl" style={{ color: "var(--theme-text)" }}>
                      {riskPercent}%
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
                      Fraud
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="theme-card rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--theme-soft)" }}>
                    Confidence
                  </p>
                  <p className="mt-2 text-xl" style={{ color: "var(--theme-text)" }}>
                    {mutation.data.confidence}
                  </p>
                </div>
                <div className="theme-card rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--theme-soft)" }}>
                    Threshold
                  </p>
                  <p className="mt-2 text-xl" style={{ color: "var(--theme-text)" }}>
                    {mutation.data.decision_threshold.toFixed(2)}
                  </p>
                </div>
                <div className="theme-card rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--theme-soft)" }}>
                    Inference Time
                  </p>
                  <p className="mt-2 text-xl" style={{ color: "var(--theme-text)" }}>
                    {mutation.data.inference_time_ms.toFixed(3)} ms
                  </p>
                </div>
              </div>
            </div>

            <div className="theme-card-soft rounded-[2rem] border p-6">
              <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--theme-soft)" }}>
                Feature Breakdown
              </p>
              <div className="mt-5 space-y-4">
                {mutation.data.feature_breakdown.map((feature) => (
                  <div key={feature.feature}>
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium capitalize" style={{ color: "var(--theme-text)" }}>
                          {feature.feature.replaceAll("_", " ")}
                        </p>
                        <p className="font-mono text-xs" style={{ color: "var(--theme-soft)" }}>
                          {feature.symbol} • value {feature.value}
                        </p>
                      </div>
                      <span className="text-sm" style={{ color: "var(--theme-muted)" }}>
                        {feature.contribution.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full" style={{ backgroundColor: "var(--theme-border)" }}>
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.max(feature.contribution, 6)}%`,
                          backgroundColor:
                            feature.direction === "risk"
                              ? "var(--theme-danger)"
                              : feature.direction === "protective"
                                ? "var(--theme-success)"
                                : "var(--theme-soft)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
