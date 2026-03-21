import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";

import App from "./App";
import "./index.css";
import { applyTheme, resolveTheme } from "./theme";

applyTheme(resolveTheme());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
});

function ErrorFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6" style={{ backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }}>
      <div className="theme-panel max-w-lg rounded-3xl border p-8">
        <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--theme-danger)" }}>
          Query Boundary
        </p>
        <h1 className="mt-3 text-2xl font-semibold">The dashboard hit an unexpected frontend error.</h1>
        <p className="mt-3 text-sm" style={{ color: "var(--theme-muted)" }}>
          Refresh the page or verify that the API is reachable at the configured backend URL.
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary fallbackRender={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
