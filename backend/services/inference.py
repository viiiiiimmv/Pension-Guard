from __future__ import annotations

import json
import os
from pathlib import Path
from time import perf_counter

import joblib
import numpy as np
import pandas as pd

import settings
from models.schemas import FeatureContribution, PredictionResponse

FEATURE_ORDER = [
    "age",
    "life_proof_delay",
    "bank_activity_count",
    "biometric_status",
    "historical_approval_rate",
    "pension_credit_anomaly",
]

FEATURE_SYMBOLS = {
    "age": "x1",
    "life_proof_delay": "x2",
    "bank_activity_count": "x3",
    "biometric_status": "x4",
    "historical_approval_rate": "x5",
    "pension_credit_anomaly": "x6",
}


class ModelNotFoundError(RuntimeError):
    pass


class InferenceService:
    def __init__(self, models_dir: Path | None = None) -> None:
        resolved_models_dir = models_dir or os.getenv("ML_MODELS_PATH") or (settings.PROJECT_ROOT / "ml" / "models")
        self.models_dir = Path(resolved_models_dir).resolve()
        self.model_path = self.models_dir / "gbdt_model.joblib"
        self.scaler_path = self.models_dir / "scaler.joblib"
        self.threshold_path = self.models_dir / "threshold.json"

        self.model = None
        self.scaler = None
        self.threshold = 0.5
        self.load()

    def load(self) -> None:
        missing = [
            str(path)
            for path in (self.model_path, self.scaler_path, self.threshold_path)
            if not path.exists()
        ]
        if missing:
            raise ModelNotFoundError(
                "Missing trained model artifacts. Run `python ml/train.py` and `python ml/evaluate.py` first. "
                f"Expected files: {', '.join(missing)}"
            )

        self.model = joblib.load(self.model_path)
        self.scaler = joblib.load(self.scaler_path)
        threshold_payload = json.loads(self.threshold_path.read_text(encoding="utf-8"))
        self.threshold = float(threshold_payload["threshold"])

    def is_ready(self) -> bool:
        return self.model is not None and self.scaler is not None

    def _ensure_ready(self) -> None:
        if not self.is_ready():
            raise ModelNotFoundError(
                "Model artifacts are not loaded. Train the ML pipeline before serving predictions."
            )

    def _prepare_frame(self, record: dict[str, float | int] | list[dict[str, float | int]]) -> pd.DataFrame:
        if isinstance(record, list):
            frame = pd.DataFrame(record)
        else:
            frame = pd.DataFrame([record])

        missing = [column for column in FEATURE_ORDER if column not in frame.columns]
        if missing:
            raise ValueError(f"Missing prediction features: {', '.join(missing)}")
        return frame.loc[:, FEATURE_ORDER].astype(float)

    def _confidence_label(self, fraud_probability: float) -> str:
        margin = abs(fraud_probability - self.threshold)
        if margin >= 0.2:
            return "HIGH"
        if margin >= 0.1:
            return "MEDIUM"
        return "LOW"

    def _feature_breakdown(self, row: pd.Series) -> list[FeatureContribution]:
        raw_components = {
            "life_proof_delay": max(0.0, row["life_proof_delay"] / 180) * 1.8,
            "pension_credit_anomaly": float(row["pension_credit_anomaly"]) * 2.2,
            "biometric_status": (1 - float(row["biometric_status"])) * 2.0,
            "bank_activity_count": max(0.0, (4 - row["bank_activity_count"]) / 4) * 1.4,
            "historical_approval_rate": max(0.0, 0.8 - row["historical_approval_rate"]) * 2.6,
            "age": max(0.0, (row["age"] - 72) / 18) * 0.8,
        }

        total = sum(raw_components.values()) or 1.0
        breakdown: list[FeatureContribution] = []
        for feature, score in sorted(raw_components.items(), key=lambda item: item[1], reverse=True):
            value = float(row[feature])
            direction = "risk" if score > 0.05 else "neutral"
            if feature == "biometric_status" and value == 1:
                direction = "protective"
            if feature == "historical_approval_rate" and value >= 0.8:
                direction = "protective"

            breakdown.append(
                FeatureContribution(
                    feature=feature,
                    symbol=FEATURE_SYMBOLS[feature],
                    value=round(value, 4),
                    contribution=round((score / total) * 100, 2),
                    direction=direction,
                )
            )
        return breakdown

    def predict(self, record: dict[str, float | int], pensioner_id: str = "PRED-ONESHOT") -> PredictionResponse:
        response = self.predict_many([record], pensioner_ids=[pensioner_id])[0]
        return response

    def predict_many(
        self,
        records: list[dict[str, float | int]],
        pensioner_ids: list[str] | None = None,
    ) -> list[PredictionResponse]:
        self._ensure_ready()
        frame = self._prepare_frame(records)

        started_at = perf_counter()
        scaled = self.scaler.transform(frame)
        probabilities = self.model.predict_proba(scaled)[:, 1]
        elapsed_ms = ((perf_counter() - started_at) * 1000.0) / max(len(frame), 1)

        ids = pensioner_ids or [f"PRED-{index + 1:05d}" for index in range(len(frame))]
        responses: list[PredictionResponse] = []
        for row, fraud_probability, pensioner_id in zip(frame.to_dict(orient="records"), probabilities, ids):
            probability = float(fraud_probability)
            eligible = probability < self.threshold
            responses.append(
                PredictionResponse(
                    pensioner_id=pensioner_id,
                    eligible=eligible,
                    fraud_probability=round(probability, 4),
                    confidence=self._confidence_label(probability),
                    decision_threshold=round(self.threshold, 2),
                    inference_time_ms=round(elapsed_ms, 3),
                    feature_breakdown=self._feature_breakdown(pd.Series(row)),
                )
            )
        return responses
