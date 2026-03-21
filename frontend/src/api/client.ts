import axios from "axios";

import { emitUnauthorizedEvent, getStoredAuthToken } from "../auth";
import type {
  AuthSessionResponse,
  ConfusionMatrixResponse,
  DistributionResponse,
  FeatureImportanceItem,
  HealthResponse,
  MetricsResponse,
  PensionerListResponse,
  PensionerRecord,
  PredictionResponse,
  StatusFilter,
  SummaryResponse,
  TokenResponse,
} from "../types";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const statusCode = error.response?.status;
    const requestUrl = String(error.config?.url ?? "");
    const isAuthEndpoint = requestUrl.startsWith("/api/auth/");
    if (statusCode === 401 && !isAuthEndpoint && getStoredAuthToken()) {
      emitUnauthorizedEvent();
    }
    return Promise.reject(error);
  },
);

export interface PensionerQuery {
  page?: number;
  page_size?: number;
  search?: string;
  filter_by?: StatusFilter;
  sort_by?: "created_at" | "age" | "life_proof_delay" | "fraud_probability";
  sort_order?: "asc" | "desc";
}

export const fetchHealth = async () => (await api.get<HealthResponse>("/api/health")).data;
export const loginWithPasscode = async (payload: { passcode: string }) =>
  (await api.post<TokenResponse>("/api/auth/login", payload)).data;
export const fetchCurrentSession = async () =>
  (await api.get<AuthSessionResponse>("/api/auth/me")).data;
export const logoutSession = async () => (await api.post("/api/auth/logout")).data;
export const fetchSummary = async () => (await api.get<SummaryResponse>("/api/analytics/summary")).data;
export const fetchMetrics = async () => (await api.get<MetricsResponse>("/api/analytics/metrics")).data;
export const fetchConfusion = async () =>
  (await api.get<ConfusionMatrixResponse>("/api/analytics/confusion")).data;
export const fetchFeatures = async () =>
  (await api.get<FeatureImportanceItem[]>("/api/analytics/features")).data;
export const fetchDistribution = async () =>
  (await api.get<DistributionResponse>("/api/analytics/distribution")).data;
export const fetchProtectedReportAsset = async (filename: string) =>
  (await api.get<Blob>(`/api/reports/${filename}`, { responseType: "blob" })).data;
export const fetchPensioners = async (query: PensionerQuery) =>
  (await api.get<PensionerListResponse>("/api/pensioners", { params: query })).data;
export const fetchPensioner = async (pensionerId: string) =>
  (await api.get<PensionerRecord>(`/api/pensioners/${pensionerId}`)).data;

export const predictSingle = async (payload: {
  age: number;
  life_proof_delay: number;
  bank_activity_count: number;
  biometric_status: number;
  historical_approval_rate: number;
  pension_credit_anomaly: number;
}) => (await api.post<PredictionResponse>("/api/predict", payload)).data;
