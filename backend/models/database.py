from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Pensioner(Base):
    __tablename__ = "pensioners"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    pensioner_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    age: Mapped[float] = mapped_column(Float)
    life_proof_delay: Mapped[float] = mapped_column(Float)
    bank_activity_count: Mapped[int] = mapped_column(Integer)
    biometric_status: Mapped[int] = mapped_column(Integer)
    historical_approval_rate: Mapped[float] = mapped_column(Float)
    pension_credit_anomaly: Mapped[int] = mapped_column(Integer)
    eligibility_label: Mapped[int] = mapped_column(Integer)
    predicted_label: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fraud_probability: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence: Mapped[str | None] = mapped_column(String(16), nullable=True)
    decision_threshold: Mapped[float | None] = mapped_column(Float, nullable=True)
    inference_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
