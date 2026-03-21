from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

import pandas as pd
from sqlalchemy import delete, insert
from sqlalchemy.orm import Session

from database import SessionLocal, create_tables
from models.database import Pensioner
from services.inference import FEATURE_ORDER, InferenceService

DEFAULT_CSV_PATH = Path(__file__).resolve().parents[1] / "ml" / "data" / "pensioners.csv"


def _chunked(items: list[dict], size: int) -> list[list[dict]]:
    return [items[index : index + size] for index in range(0, len(items), size)]


def seed_from_dataframe(
    db: Session,
    frame: pd.DataFrame,
    inference_service: InferenceService,
    reset: bool = True,
) -> int:
    required = {"pensioner_id", *FEATURE_ORDER, "eligibility_label"}
    missing = required.difference(frame.columns)
    if missing:
        raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing))}")

    frame = frame.copy()
    predictions = inference_service.predict_many(
        frame.loc[:, FEATURE_ORDER].to_dict(orient="records"),
        pensioner_ids=frame["pensioner_id"].astype(str).tolist(),
    )
    prediction_lookup = {item.pensioner_id: item for item in predictions}

    now = datetime.now(UTC)
    records: list[dict] = []
    for row in frame.to_dict(orient="records"):
        prediction = prediction_lookup[str(row["pensioner_id"])]
        records.append(
            {
                "pensioner_id": str(row["pensioner_id"]),
                "age": float(row["age"]),
                "life_proof_delay": float(row["life_proof_delay"]),
                "bank_activity_count": int(row["bank_activity_count"]),
                "biometric_status": int(row["biometric_status"]),
                "historical_approval_rate": float(row["historical_approval_rate"]),
                "pension_credit_anomaly": int(row["pension_credit_anomaly"]),
                "eligibility_label": int(row["eligibility_label"]),
                "predicted_label": 1 if prediction.eligible else 0,
                "fraud_probability": float(prediction.fraud_probability),
                "confidence": prediction.confidence,
                "decision_threshold": float(prediction.decision_threshold),
                "inference_time_ms": float(prediction.inference_time_ms),
                "created_at": now,
                "updated_at": now,
            }
        )

    if reset:
        db.execute(delete(Pensioner))
        db.commit()

    for chunk in _chunked(records, 1000):
        db.execute(insert(Pensioner), chunk)
        db.commit()

    return len(records)


def seed_database(csv_path: Path = DEFAULT_CSV_PATH) -> int:
    create_tables()
    frame = pd.read_csv(csv_path)
    service = InferenceService()
    with SessionLocal() as db:
        return seed_from_dataframe(db, frame, service, reset=True)


def main() -> None:
    inserted = seed_database()
    print(f"Seeded {inserted} pensioner records into SQLite.")


if __name__ == "__main__":
    main()
