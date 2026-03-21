import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, MoonStar, ShieldCheck, SunMedium } from "lucide-react";
import axios from "axios";

import { loginWithPasscode } from "../api/client";
import type { Theme } from "../theme";
import type { TokenResponse } from "../types";

interface LoginScreenProps {
  theme: Theme;
  onToggleTheme: () => void;
  onAuthenticated: (payload: TokenResponse) => void;
  isCheckingSession: boolean;
}

function extractErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail ?? error.message;
  }
  return "Something went wrong while processing authentication.";
}

export function LoginScreen({
  theme,
  onToggleTheme,
  onAuthenticated,
  isCheckingSession,
}: LoginScreenProps) {
  const [passcode, setPasscode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: loginWithPasscode,
    onSuccess: (payload) => {
      setErrorMessage(null);
      onAuthenticated(payload);
    },
    onError: (error) => {
      setErrorMessage(extractErrorMessage(error));
    },
  });

  return (
    <div className="min-h-screen px-4 py-6" style={{ backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="theme-panel rounded-[2rem] border p-8 lg:p-10">
            <div
              className="inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium"
              style={{
                borderColor: "var(--theme-accent-border)",
                backgroundColor: "var(--theme-accent-soft)",
                color: "var(--theme-accent)",
              }}
            >
              <ShieldCheck className="h-4 w-4" />
              Secure Officer Access
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight">PensionGuard AI</h1>
            <p className="mt-4 max-w-2xl text-base leading-7" style={{ color: "var(--theme-muted)" }}>
              Enter the secure 8-digit access code configured for this deployment. The backend hashes the submitted
              value, validates it, and then issues a protected session for the dashboard.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { title: "Step 1", description: "Set an 8-digit login code in the backend env file." },
                { title: "Step 2", description: "Enter that access code here." },
                { title: "Step 3", description: "Unlock the protected officer dashboard." },
              ].map((item) => (
                <div key={item.title} className="theme-card-soft rounded-3xl border p-4">
                  <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm font-medium" style={{ color: "var(--theme-text)" }}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="theme-panel rounded-[2rem] border p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
                  Officer Login
                </p>
                <h2 className="mt-2 text-3xl font-semibold">Enter Access Code</h2>
              </div>
              <button
                type="button"
                onClick={onToggleTheme}
                className="theme-outline-btn inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition"
              >
                {theme === "light" ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
                <span>{theme === "light" ? "Dark" : "Light"}</span>
              </button>
            </div>

            <div className="mt-8 space-y-4">
              <div className="theme-card-soft rounded-3xl border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: "var(--theme-text)" }}>
                    Verification
                  </span>
                  <ShieldCheck className="h-4 w-4" style={{ color: "var(--theme-soft)" }} />
                </div>
                <p className="mt-4 text-sm leading-6" style={{ color: "var(--theme-muted)" }}>
                  This deployment now uses a single env-configured access code instead of email delivery or OTP
                  generation.
                </p>
              </div>

              <label className="theme-card-soft block rounded-3xl border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: "var(--theme-text)" }}>
                    8-Digit Access Code
                  </span>
                  <KeyRound className="h-4 w-4" style={{ color: "var(--theme-soft)" }} />
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={passcode}
                  disabled={isCheckingSession}
                  onChange={(event) => {
                    setPasscode(event.target.value.replace(/\D/g, "").slice(0, 8));
                    setErrorMessage(null);
                  }}
                  placeholder="12345678"
                  className="theme-input mt-4 w-full rounded-2xl border px-4 py-3 font-mono text-lg tracking-[0.3em] outline-none"
                />
              </label>
            </div>

            {errorMessage ? (
              <div
                className="mt-5 rounded-2xl border px-4 py-3 text-sm"
                style={{
                  borderColor: "var(--theme-danger-border)",
                  backgroundColor: "var(--theme-danger-soft)",
                  color: "var(--theme-danger)",
                }}
              >
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                disabled={passcode.length !== 8 || loginMutation.isPending || isCheckingSession}
                onClick={() => loginMutation.mutate({ passcode })}
                className="theme-primary-btn rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loginMutation.isPending || isCheckingSession ? "Unlocking..." : "Unlock Dashboard"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
