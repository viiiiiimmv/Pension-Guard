from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from database import get_db
from models.schemas import (
    ConfusionMatrixResponse,
    DistributionResponse,
    FeatureImportanceItem,
    MetricsResponse,
    SummaryResponse,
)
from services.auth import require_authenticated_session

router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"],
    dependencies=[Depends(require_authenticated_session)],
)


@router.get("/summary", response_model=SummaryResponse)
def summary(request: Request, db: Session = Depends(get_db)) -> SummaryResponse:
    service = request.app.state.analytics_service
    return SummaryResponse(**service.summary(db))


@router.get("/metrics", response_model=MetricsResponse)
def metrics(request: Request) -> MetricsResponse:
    payload = request.app.state.analytics_service.load_metrics()
    return MetricsResponse(
        generated_at=payload["generated_at"],
        selected_threshold=float(payload["selected_threshold"]),
        targets=payload["targets"],
        performance_comparison=payload["performance_comparison"],
        latency_benchmark_ms=payload["latency_benchmark_ms"],
    )


@router.get("/confusion", response_model=ConfusionMatrixResponse)
def confusion(request: Request) -> ConfusionMatrixResponse:
    payload = request.app.state.analytics_service.load_metrics()
    matrix = payload["confusion_matrix"]
    return ConfusionMatrixResponse(
        tp=int(matrix["tp"]),
        tn=int(matrix["tn"]),
        fp=int(matrix["fp"]),
        fn=int(matrix["fn"]),
        reference=payload.get("paper_reference_confusion_matrix"),
    )


@router.get("/features", response_model=list[FeatureImportanceItem])
def features(request: Request) -> list[FeatureImportanceItem]:
    payload = request.app.state.analytics_service.load_metrics()
    return [FeatureImportanceItem(**item) for item in payload["feature_importance"]]


@router.get("/distribution", response_model=DistributionResponse)
def distribution(request: Request, db: Session = Depends(get_db)) -> DistributionResponse:
    payload = request.app.state.analytics_service.distribution(db)
    return DistributionResponse(**payload)
