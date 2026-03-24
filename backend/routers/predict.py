from __future__ import annotations

from fastapi import APIRouter, Request

from models.schemas import PredictionRequest, PredictionResponse
from services.inference import ModelNotFoundError

router = APIRouter(prefix="/api", tags=["prediction"])


@router.post("/predict", response_model=PredictionResponse)
def predict_single(payload: PredictionRequest, request: Request) -> PredictionResponse:
    service = request.app.state.inference_service
    if service is None:
        raise ModelNotFoundError(request.app.state.model_error or "Model artifacts are not available.")
    pensioner_id = payload.pensioner_id or "PRED-ONESHOT"
    return service.predict(payload.model_dump(exclude={"pensioner_id"}), pensioner_id=pensioner_id)


@router.post("/predict/batch", response_model=list[PredictionResponse])
def predict_batch(payload: list[PredictionRequest], request: Request) -> list[PredictionResponse]:
    service = request.app.state.inference_service
    if service is None:
        raise ModelNotFoundError(request.app.state.model_error or "Model artifacts are not available.")
    pensioner_ids = [item.pensioner_id or f"PRED-{index + 1:05d}" for index, item in enumerate(payload)]
    records = [item.model_dump(exclude={"pensioner_id"}) for item in payload]
    return service.predict_many(records, pensioner_ids=pensioner_ids)
