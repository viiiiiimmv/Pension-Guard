import { useEffect } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ActivitySquare,
  DatabaseZap,
  LayoutDashboard,
  ShieldAlert,
  Sparkles,
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
      : "Waiting on artifacts";
  const healthDetail =
    healthQuery.data?.model_error ??
    (healthQuery.isError
      ? "Set VITE_API_URL to a deployed backend URL or start the FastAPI service."
      : null);

  useEffect(() => {
    document.documentElement.style.colorScheme = "dark";
  }, []);

  return (
    <div className="app-shell min-h-screen" style={{ backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }}>
      <aside className="app-sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow">PensionGuard</p>
            <h1>Officer Console</h1>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => `sidebar-link ${isActive ? "theme-nav-active" : "theme-nav-idle"}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-panel">
          <DatabaseZap className="h-4 w-4" />
          <div>
            <p>Live Workspace</p>
            <span>Internal review deployment</span>
          </div>
        </div>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Government-grade pension intelligence</p>
            <h2>Smart Pension Distribution System</h2>
          </div>

          <div className="topbar-cluster">
            <div className="health-pill">
              <span
                className="status-dot"
                style={{ backgroundColor: modelReady ? "var(--theme-success)" : "var(--theme-danger)" }}
              />
              <div>
                <p>Model Health</p>
                <span>{healthMessage}</span>
              </div>
            </div>
            <div className="threshold-chip">
              <Sparkles className="h-4 w-4" />
              <span>Fraud probability theta*</span>
            </div>
          </div>
        </header>

        {healthDetail ? <div className="system-alert">{healthDetail}</div> : null}

        <main className="content-stage">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pensioners" element={<Pensioners />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
