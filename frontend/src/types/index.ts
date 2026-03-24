export type StatusFilter = "all" | "eligible" | "flagged" | "pending";

export interface FeatureContribution {
  feature: string;
  symbol: string;
  value: number;
  contribution: number;
  direction: "risk" | "protective" | "neutral";
}

export interface PredictionResponse {
  pensioner_id: string;
  eligible: boolean;
  fraud_probability: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  decision_threshold: number;
  inference_time_ms: number;
  feature_breakdown: FeatureContribution[];
}

export interface PensionerRecord {
  id: number;
  pensioner_id: string;
  age: number;
  life_proof_delay: number;
  bank_activity_count: number;
  biometric_status: number;
  historical_approval_rate: number;
  pension_credit_anomaly: number;
  eligibility_label: number;
  predicted_label: number | null;
  fraud_probability: number | null;
  confidence: string | null;
  decision_threshold: number | null;
  inference_time_ms: number | null;
  created_at: string;
  updated_at: string | null;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export interface PensionerListResponse {
  items: PensionerRecord[];
  pagination: PaginationMeta;
}

export interface SummaryResponse {
  total: number;
  eligible_count: number;
  fraud_count: number;
  pending_count: number;
  fraud_rate: number;
  avg_fraud_probability: number;
}

export interface MetricRow {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc?: number;
  pr_auc?: number;
}

export interface MetricsResponse {
  generated_at: string;
  selected_threshold: number;
  targets: Record<string, number>;
  performance_comparison: MetricRow[];
  latency_benchmark_ms: Record<string, number>;
}

export interface ConfusionMatrixResponse {
  tp: number;
  tn: number;
  fp: number;
  fn: number;
  reference?: Record<string, number>;
}

export interface FeatureImportanceItem {
  feature: string;
  label: string;
  importance: number;
}

export interface DistributionSeries {
  counts: number[];
  edges: number[];
}

export interface DistributionResponse {
  age: DistributionSeries;
  life_proof_delay: DistributionSeries;
}

export interface HealthResponse {
  status: string;
  model_ready: boolean;
  model_error: string | null;
  reports_dir: string;
}
