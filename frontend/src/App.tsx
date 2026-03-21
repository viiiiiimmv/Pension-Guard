import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ActivitySquare,
  LayoutDashboard,
  LogOut,
  MoonStar,
  ShieldAlert,
  SunMedium,
  UsersRound,
} from "lucide-react";

import { clearAuthToken, getStoredAuthToken, storeAuthToken, AUTH_UNAUTHORIZED_EVENT } from "./auth";
import { fetchCurrentSession, fetchHealth, logoutSession } from "./api/client";
import { LoginScreen } from "./components/LoginScreen";
import { Analytics } from "./pages/Analytics";
import { Dashboard } from "./pages/Dashboard";
import { Pensioners } from "./pages/Pensioners";
import { Predict } from "./pages/Predict";
import { applyTheme, persistTheme, resolveTheme, type Theme } from "./theme";
import type { AuthSessionResponse, TokenResponse } from "./types";

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pensioners", label: "Pensioners", icon: UsersRound },
  { to: "/predict", label: "Predict", icon: ShieldAlert },
  { to: "/analytics", label: "Analytics", icon: ActivitySquare },
];

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => resolveTheme());
  const [accessToken, setAccessToken] = useState<string | null>(() => getStoredAuthToken());
  const [session, setSession] = useState<AuthSessionResponse | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(getStoredAuthToken()));
  const healthQuery = useQuery({ queryKey: ["health"], queryFn: fetchHealth, retry: false });
  const modelReady = healthQuery.data?.model_ready;
  const nextTheme = theme === "light" ? "dark" : "light";

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthToken();
      setAccessToken(null);
      setSession(null);
      setIsCheckingSession(false);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!accessToken) {
      setSession(null);
      setIsCheckingSession(false);
      return () => {
        active = false;
      };
    }

    setIsCheckingSession(true);
    fetchCurrentSession()
      .then((payload) => {
        if (!active) {
          return;
        }
        setSession(payload);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        clearAuthToken();
        setAccessToken(null);
        setSession(null);
      })
      .finally(() => {
        if (active) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  function handleAuthenticated(payload: TokenResponse) {
    storeAuthToken(payload.access_token);
    setAccessToken(payload.access_token);
    setSession({ identity: payload.identity, expires_at: payload.expires_at });
    setIsCheckingSession(false);
  }

  async function handleLogout() {
    try {
      await logoutSession();
    } catch {
      // Best-effort logout; local session is cleared regardless.
    }
    clearAuthToken();
    setAccessToken(null);
    setSession(null);
  }

  if (!session) {
    return (
      <LoginScreen
        theme={theme}
        onToggleTheme={() => setTheme(nextTheme)}
        onAuthenticated={handleAuthenticated}
        isCheckingSession={isCheckingSession}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }}>
      <div className="mx-auto min-h-screen w-full max-w-[1840px] px-3 py-3 lg:px-4">
        <header className="theme-panel rounded-[1.75rem] border px-4 py-4 lg:px-5">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.34em]" style={{ color: "var(--theme-soft)" }}>
                  PensionGuard AI
                </p>
                <h1 className="mt-1 text-[1.9rem] font-semibold leading-tight" style={{ color: "var(--theme-text)" }}>
                  Officer Console
                </h1>
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
                        `inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
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

            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              <div className="theme-card-soft min-w-[220px] rounded-2xl border px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: "var(--theme-soft)" }}>
                  Signed in as
                </p>
                <p className="mt-1 text-sm font-medium" style={{ color: "var(--theme-text)" }}>
                  {session.identity}
                </p>
                <p className="mt-1 text-xs" style={{ color: "var(--theme-muted)" }}>
                  Session valid until {new Date(session.expires_at).toLocaleString()}
                </p>
              </div>

              <div className="theme-card-soft min-w-[220px] rounded-2xl border px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: "var(--theme-soft)" }}>
                  Model Health
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: modelReady ? "var(--theme-success)" : "var(--theme-danger)",
                      boxShadow: modelReady
                        ? "0 0 20px color-mix(in srgb, var(--theme-success) 28%, transparent)"
                        : "0 0 20px color-mix(in srgb, var(--theme-danger) 24%, transparent)",
                    }}
                  />
                  <p className="text-sm" style={{ color: "var(--theme-muted)" }}>
                    {modelReady ? "Artifacts loaded" : "Waiting on training artifacts"}
                  </p>
                </div>
                {healthQuery.data?.model_error ? (
                  <p className="mt-2 text-xs leading-5" style={{ color: "var(--theme-soft)" }}>
                    {healthQuery.data.model_error}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setTheme(nextTheme)}
                aria-label={`Switch to ${nextTheme} theme`}
                className="theme-outline-btn inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition"
              >
                {theme === "light" ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
                <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="theme-outline-btn inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="theme-panel mt-3 min-w-0 rounded-[1.75rem] border p-3 lg:p-4">
          <header className="theme-card-soft mb-4 rounded-[1.5rem] border px-4 py-4 lg:px-5">
            <p className="text-xs uppercase tracking-[0.34em]" style={{ color: "var(--theme-soft)" }}>
              Government-grade pension intelligence
            </p>
            <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-3xl font-semibold" style={{ color: "var(--theme-text)" }}>
                  Smart Pension Distribution System
                </h2>
                <p className="mt-1 text-sm" style={{ color: "var(--theme-muted)" }}>
                  ML-driven eligibility verification, fraud detection, and officer review workflow.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="theme-card rounded-2xl border px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.22em]" style={{ color: "var(--theme-soft)" }}>
                    Primary Threshold
                  </p>
                  <p className="mt-1 font-mono text-lg" style={{ color: "var(--theme-text)" }}>
                    Fraud probability θ*
                  </p>
                </div>
              </div>
            </div>
          </header>

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
