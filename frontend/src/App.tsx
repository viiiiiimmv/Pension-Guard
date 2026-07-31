import { useEffect } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ActivitySquare,
  LayoutDashboard,
  ShieldAlert,
  UsersRound,
} from "lucide-react";

import { fetchHealth } from "./api/client";
import { Analytics } from "./pages/Analytics";
import { Dashboard } from "./pages/Dashboard";
import { Pensioners } from "./pages/Pensioners";
import { Predict } from "./pages/Predict";

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pensioners", label: "Pensioners", icon: UsersRound },
  { to: "/predict", label: "Predict", icon: ShieldAlert },
  { to: "/analytics", label: "Analytics", icon: ActivitySquare },
];

export default function App() {
  const healthQuery = useQuery({ queryKey: ["health"], queryFn: fetchHealth, retry: false });
  const modelReady = healthQuery.data?.model_ready;
  const healthMessage = healthQuery.isError
    ? "API unavailable"
    : modelReady
      ? "Artifacts loaded"
      : "Waiting on training artifacts";
  const healthDetail = healthQuery.data?.model_error ?? (healthQuery.isError ? "The API endpoint could not be reached. Set VITE_API_URL to a deployed backend URL or deploy the FastAPI service." : null);

  useEffect(() => {
    document.documentElement.style.colorScheme = "dark";
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1700px] flex-col px-3 py-3 lg:px-4 lg:py-4">
        <header className="theme-panel rounded-[2rem] border px-4 py-4 lg:px-6 lg:py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.36em]" style={{ color: "var(--theme-soft)" }}>
                PensionGuard AI
              </p>
              <div>
                <h1 className="text-[1.7rem] font-semibold tracking-[-0.02em] sm:text-[2.05rem]" style={{ color: "var(--theme-text)" }}>
                  Officer Console
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--theme-muted)" }}>
                  A premium, monochrome operating layer for pension eligibility review, fraud detection, and model oversight.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="theme-card-soft min-w-[220px] rounded-[1.4rem] border px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
                  System Status
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--theme-text)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--theme-text)" }}>
                    {healthMessage}
                  </span>
                </div>
                {healthDetail ? (
                  <p className="mt-2 text-xs leading-5" style={{ color: "var(--theme-soft)" }}>
                    {healthDetail}
                  </p>
                ) : null}
              </div>

              <nav className="flex flex-wrap gap-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        `inline-flex items-center gap-2 rounded-[1.1rem] border px-3.5 py-2.5 text-sm font-medium transition ${
                          isActive ? "theme-nav-active" : "theme-nav-idle"
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>
        </header>

        <main className="mt-3 flex-1 rounded-[2rem] border border-white/10 bg-black/10 p-3 lg:p-4">
          <div className="rounded-[1.7rem] border border-white/10 bg-[rgba(255,255,255,0.02)] p-3 lg:p-4">
            <header className="theme-card-soft mb-4 rounded-[1.5rem] border px-4 py-4 lg:px-5 lg:py-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.36em]" style={{ color: "var(--theme-soft)" }}>
                    Government-grade pension intelligence
                  </p>
                  <h2 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.02em] sm:text-[1.95rem]" style={{ color: "var(--theme-text)" }}>
                    Smart Pension Distribution System
                  </h2>
                </div>
                <div className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em]" style={{ color: "var(--theme-soft)" }}>
                    Primary threshold
                  </p>
                  <p className="mt-1 text-sm font-medium" style={{ color: "var(--theme-text)" }}>
                    Fraud probability θ*
                  </p>
                </div>
              </div>
            </header>

            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pensioners" element={<Pensioners />} />
              <Route path="/predict" element={<Predict />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
