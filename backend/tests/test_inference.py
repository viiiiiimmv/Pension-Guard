from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.inference import InferenceService


class IdentityScaler:
    def transform(self, frame):
        return np.asarray(frame, dtype=float)


class DummyFraudModel:
    def predict_proba(self, data):
        data = np.asarray(data, dtype=float)
        risk = np.clip((data[:, 1] / 180) + (1 - data[:, 3]) * 0.4 + data[:, 5] * 0.3, 0, 0.99)
        return np.column_stack([1 - risk, risk])


def test_inference_service_loads_artifacts_and_predicts(tmp_path: Path) -> None:
    joblib.dump(DummyFraudModel(), tmp_path / "gbdt_model.joblib")
    joblib.dump(IdentityScaler(), tmp_path / "scaler.joblib")
    (tmp_path / "threshold.json").write_text(json.dumps({"threshold": 0.4}), encoding="utf-8")

    service = InferenceService(models_dir=tmp_path)
    result = service.predict(
        {
            "age": 70,
            "life_proof_delay": 120,
            "bank_activity_count": 1,
            "biometric_status": 0,
            "historical_approval_rate": 0.65,
            "pension_credit_anomaly": 1,
        },
        pensioner_id="PNS-99999",
    )

    assert result.pensioner_id == "PNS-99999"
    assert result.fraud_probability > 0.4
    assert result.eligible is False
    assert result.feature_breakdown
