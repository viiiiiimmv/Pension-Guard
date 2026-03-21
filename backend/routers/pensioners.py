from __future__ import annotations

from datetime import UTC, datetime
from math import ceil
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from database import get_db
from models.database import Pensioner
from models.schemas import (
    BulkSeedResponse,
    PaginationMeta,
    PensionerCreate,
    PensionerListResponse,
    PensionerResponse,
    PensionerUpdate,
)
from seed import seed_from_dataframe
from services.auth import require_authenticated_session
from services.inference import FEATURE_ORDER, ModelNotFoundError

router = APIRouter(
    prefix="/api/pensioners",
    tags=["pensioners"],
    dependencies=[Depends(require_authenticated_session)],
)


def _next_pensioner_id(db: Session) -> str:
    latest = db.scalar(select(Pensioner.pensioner_id).order_by(Pensioner.id.desc()).limit(1))
    if not latest:
        return "PNS-00001"
    try:
        next_number = int(latest.split("-")[1]) + 1
    except (IndexError, ValueError):
        next_number = int(db.scalar(select(func.count()).select_from(Pensioner)) or 0) + 1
    return f"PNS-{next_number:05d}"


def _base_query() -> Select[tuple[Pensioner]]:
    return select(Pensioner).where(Pensioner.deleted_at.is_(None))


def _serialize(record: Pensioner) -> PensionerResponse:
    return PensionerResponse.model_validate(record)


@router.get("", response_model=PensionerListResponse)
def list_pensioners(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str | None = None,
    filter_by: str = Query("all", pattern="^(all|eligible|flagged|pending)$"),
    sort_by: str = Query("created_at", pattern="^(created_at|age|life_proof_delay|fraud_probability)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
) -> PensionerListResponse:
    query = _base_query()
    status_label = func.coalesce(Pensioner.predicted_label, Pensioner.eligibility_label)

    if search:
        query = query.where(Pensioner.pensioner_id.ilike(f"%{search}%"))
    if filter_by == "eligible":
        query = query.where(status_label == 1)
    elif filter_by == "flagged":
        query = query.where(status_label == 0)
    elif filter_by == "pending":
        query = query.where(Pensioner.predicted_label.is_(None))

    sort_column = getattr(Pensioner, sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    total_items = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = db.scalars(query.offset((page - 1) * page_size).limit(page_size)).all()

    return PensionerListResponse(
        items=[_serialize(item) for item in items],
        pagination=PaginationMeta(
            page=page,
            page_size=page_size,
            total_items=int(total_items),
            total_pages=max(1, ceil(total_items / page_size)) if total_items else 1,
        ),
    )


@router.get("/{pensioner_id}", response_model=PensionerResponse)
def get_pensioner(pensioner_id: str, db: Session = Depends(get_db)) -> PensionerResponse:
    record = db.scalar(
        _base_query().where(Pensioner.pensioner_id == pensioner_id)
    )
    if record is None:
        raise HTTPException(status_code=404, detail="Pensioner not found")
    return _serialize(record)


@router.post("", response_model=PensionerResponse, status_code=201)
def create_pensioner(
    payload: PensionerCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> PensionerResponse:
    service = request.app.state.inference_service
    if service is None:
        raise ModelNotFoundError(request.app.state.model_error or "Model artifacts are not available.")
    pensioner_id = _next_pensioner_id(db)
    prediction = service.predict(payload.model_dump(exclude={"eligibility_label"}), pensioner_id=pensioner_id)

    record = Pensioner(
        pensioner_id=pensioner_id,
        **payload.model_dump(),
        predicted_label=1 if prediction.eligible else 0,
        fraud_probability=prediction.fraud_probability,
        confidence=prediction.confidence,
        decision_threshold=prediction.decision_threshold,
        inference_time_ms=prediction.inference_time_ms,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _serialize(record)


@router.put("/{pensioner_id}", response_model=PensionerResponse)
def update_pensioner(
    pensioner_id: str,
    payload: PensionerUpdate,
    request: Request,
    db: Session = Depends(get_db),
) -> PensionerResponse:
    record = db.scalar(_base_query().where(Pensioner.pensioner_id == pensioner_id))
    if record is None:
        raise HTTPException(status_code=404, detail="Pensioner not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)

    service = request.app.state.inference_service
    if service is None:
        raise ModelNotFoundError(request.app.state.model_error or "Model artifacts are not available.")
    features = {feature: getattr(record, feature) for feature in FEATURE_ORDER}
    prediction = service.predict(features, pensioner_id=record.pensioner_id)
    record.predicted_label = 1 if prediction.eligible else 0
    record.fraud_probability = prediction.fraud_probability
    record.confidence = prediction.confidence
    record.decision_threshold = prediction.decision_threshold
    record.inference_time_ms = prediction.inference_time_ms
    record.updated_at = datetime.now(UTC)

    db.add(record)
    db.commit()
    db.refresh(record)
    return _serialize(record)


@router.delete("/{pensioner_id}", status_code=204)
def delete_pensioner(pensioner_id: str, db: Session = Depends(get_db)) -> None:
    record = db.scalar(_base_query().where(Pensioner.pensioner_id == pensioner_id))
    if record is None:
        raise HTTPException(status_code=404, detail="Pensioner not found")
    record.deleted_at = datetime.now(UTC)
    db.add(record)
    db.commit()


@router.post("/bulk", response_model=BulkSeedResponse)
def bulk_seed_pensioners(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> BulkSeedResponse:
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV uploads are supported")

    frame = pd.read_csv(file.file)
    service = request.app.state.inference_service
    if service is None:
        raise ModelNotFoundError(request.app.state.model_error or "Model artifacts are not available.")
    processed = seed_from_dataframe(db, frame, service, reset=True)
    return BulkSeedResponse(
        records_processed=processed,
        source=file.filename,
        inference_applied=True,
    )
