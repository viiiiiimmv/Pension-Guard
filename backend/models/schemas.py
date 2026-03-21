from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class PensionerBase(BaseModel):
    age: float = Field(..., ge=55, le=90)
    life_proof_delay: float = Field(..., ge=0, le=180)
    bank_activity_count: int = Field(..., ge=0, le=30)
    biometric_status: int = Field(..., ge=0, le=1)
    historical_approval_rate: float = Field(..., ge=0, le=1)
    pension_credit_anomaly: int = Field(..., ge=0, le=1)


class PensionerCreate(PensionerBase):
    eligibility_label: int = Field(1, ge=0, le=1)


class PensionerUpdate(BaseModel):
    age: float | None = Field(None, ge=55, le=90)
    life_proof_delay: float | None = Field(None, ge=0, le=180)
    bank_activity_count: int | None = Field(None, ge=0, le=30)
    biometric_status: int | None = Field(None, ge=0, le=1)
    historical_approval_rate: float | None = Field(None, ge=0, le=1)
    pension_credit_anomaly: int | None = Field(None, ge=0, le=1)
    eligibility_label: int | None = Field(None, ge=0, le=1)


class PredictionRequest(PensionerBase):
    pensioner_id: str | None = None


class FeatureContribution(BaseModel):
    feature: str
    symbol: str
    value: float
    contribution: float
    direction: Literal["risk", "protective", "neutral"]


class PredictionResponse(BaseModel):
    pensioner_id: str
    eligible: bool
    fraud_probability: float
    confidence: Literal["HIGH", "MEDIUM", "LOW"]
    decision_threshold: float
    inference_time_ms: float
    feature_breakdown: list[FeatureContribution]


class PensionerResponse(PensionerBase):
    id: int
    pensioner_id: str
    eligibility_label: int
    predicted_label: int | None = None
    fraud_probability: float | None = None
    confidence: str | None = None
    decision_threshold: float | None = None
    inference_time_ms: float | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class PensionerListResponse(BaseModel):
    items: list[PensionerResponse]
    pagination: PaginationMeta


class BulkSeedResponse(BaseModel):
    records_processed: int
    source: str
    inference_applied: bool


class SummaryResponse(BaseModel):
    total: int
    eligible_count: int
    fraud_count: int
    pending_count: int
    fraud_rate: float
    avg_fraud_probability: float


class MetricRow(BaseModel):
    model: str
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: float | None = None
    pr_auc: float | None = None


class MetricsResponse(BaseModel):
    generated_at: str
    selected_threshold: float
    targets: dict[str, float]
    performance_comparison: list[MetricRow]
    latency_benchmark_ms: dict[str, float]


class ConfusionMatrixResponse(BaseModel):
    tp: int
    tn: int
    fp: int
    fn: int
    reference: dict[str, int] | None = None


class FeatureImportanceItem(BaseModel):
    feature: str
    label: str
    importance: float


class DistributionSeries(BaseModel):
    counts: list[int]
    edges: list[float]


class DistributionResponse(BaseModel):
    age: DistributionSeries
    life_proof_delay: DistributionSeries


class PasswordLoginPayload(BaseModel):
    passcode: str = Field(..., pattern=r"^\d{8}$")


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"]
    identity: str
    expires_at: datetime


class AuthSessionResponse(BaseModel):
    identity: str
    expires_at: datetime
