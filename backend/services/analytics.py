from __future__ import annotations

import json
import os
from pathlib import Path

import numpy as np
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import settings
from models.database import Pensioner


class AnalyticsService:
    def __init__(self, metrics_path: Path | None = None) -> None:
        self.metrics_path = Path(
            os.getenv(
                "ML_REPORTS_PATH",
                str(metrics_path or (settings.PROJECT_ROOT / "ml" / "reports" / "metrics.json")),
            )
        ).resolve()

    def load_metrics(self) -> dict:
        if not self.metrics_path.exists():
            return {
                "generated_at": "",
                "selected_threshold": 0.5,
                "targets": {},
                "performance_comparison": [],
                "confusion_matrix": {"tp": 0, "tn": 0, "fp": 0, "fn": 0},
                "paper_reference_confusion_matrix": {"tp": 8910, "tn": 3250, "fp": 380, "fn": 460},
                "feature_importance": [],
                "latency_benchmark_ms": {"mean_ms": 0.0, "p95_ms": 0.0, "runs": 0},
                "distribution": {
                    "age": {"counts": [], "edges": []},
                    "life_proof_delay": {"counts": [], "edges": []},
                },
            }
        return json.loads(self.metrics_path.read_text(encoding="utf-8"))

    def summary(self, db: Session) -> dict[str, float | int]:
        active_filter = Pensioner.deleted_at.is_(None)
        total = db.scalar(select(func.count()).select_from(Pensioner).where(active_filter)) or 0
        status_label = func.coalesce(Pensioner.predicted_label, Pensioner.eligibility_label)

        eligible_count = (
            db.scalar(select(func.count()).select_from(Pensioner).where(active_filter, status_label == 1)) or 0
        )
        fraud_count = (
            db.scalar(select(func.count()).select_from(Pensioner).where(active_filter, status_label == 0)) or 0
        )
        pending_count = (
            db.scalar(
                select(func.count()).select_from(Pensioner).where(active_filter, Pensioner.predicted_label.is_(None))
            )
            or 0
        )
        avg_fraud_probability = (
            db.scalar(select(func.avg(Pensioner.fraud_probability)).where(active_filter)) or 0.0
        )

        return {
            "total": int(total),
            "eligible_count": int(eligible_count),
            "fraud_count": int(fraud_count),
            "pending_count": int(pending_count),
            "fraud_rate": round((fraud_count / total) if total else 0.0, 4),
            "avg_fraud_probability": round(float(avg_fraud_probability or 0.0), 4),
        }

    def distribution(self, db: Session) -> dict[str, dict[str, list[float] | list[int]]]:
        active_filter = Pensioner.deleted_at.is_(None)
        rows = db.execute(
            select(Pensioner.age, Pensioner.life_proof_delay).where(active_filter)
        ).all()
        if not rows:
            metrics = self.load_metrics()
            return metrics["distribution"]

        ages = np.array([row.age for row in rows], dtype=float)
        delays = np.array([row.life_proof_delay for row in rows], dtype=float)
        age_counts, age_edges = np.histogram(ages, bins=10)
        delay_counts, delay_edges = np.histogram(delays, bins=10)

        return {
            "age": {
                "counts": age_counts.astype(int).tolist(),
                "edges": [round(value, 2) for value in age_edges.astype(float).tolist()],
            },
            "life_proof_delay": {
                "counts": delay_counts.astype(int).tolist(),
                "edges": [round(value, 2) for value in delay_edges.astype(float).tolist()],
            },
        }
