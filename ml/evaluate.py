from __future__ import annotations

import json
import os
from pathlib import Path

import joblib
import matplotlib
os.environ.setdefault("MPLBACKEND", "Agg")
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.inspection import permutation_importance
from sklearn.metrics import auc, precision_recall_curve, roc_curve

from common import (
    DATASET_PATH,
    DISPLAY_NAMES,
    FEATURE_COLUMNS,
    GBDT_MODEL_PATH,
    LR_MODEL_PATH,
    METRICS_PATH,
    REPORTS_DIR,
    SCALER_PATH,
    THRESHOLD_PATH,
    RuleBasedModel,
    artifact_timestamp,
    benchmark_latency,
    ensure_directories,
    evaluate_predictions,
    generate_dataset_frame,
    persist_dataset,
    prepare_splits,
)

sns.set_theme(style="whitegrid")


def _load_threshold(threshold_path: Path = THRESHOLD_PATH) -> float:
    payload = json.loads(threshold_path.read_text(encoding="utf-8"))
    return float(payload["threshold"])


def _feature_importances(model: object, X: np.ndarray, y: np.ndarray) -> np.ndarray:
    if hasattr(model, "feature_importances_"):
        return np.asarray(getattr(model, "feature_importances_"), dtype=float)

    result = permutation_importance(
        model,
        X,
        y,
        n_repeats=8,
        random_state=42,
        scoring="f1",
    )
    return np.asarray(result.importances_mean, dtype=float)


def _plot_feature_importance(feature_importances: np.ndarray) -> list[dict[str, float | str]]:
    ranking = pd.DataFrame(
        {
            "feature": FEATURE_COLUMNS,
            "display_name": [DISPLAY_NAMES[column] for column in FEATURE_COLUMNS],
            "importance": feature_importances,
        }
    ).sort_values("importance", ascending=True)

    figure, axis = plt.subplots(figsize=(10, 5))
    axis.barh(ranking["display_name"], ranking["importance"], color="#6366f1")
    axis.set_title("Feature Importance")
    axis.set_xlabel("Importance")
    axis.set_ylabel("")
    figure.tight_layout()
    figure.savefig(REPORTS_DIR / "feature_importance.png", dpi=200)
    plt.close(figure)

    return [
        {
            "feature": str(row.feature),
            "label": str(row.display_name),
            "importance": float(row.importance),
        }
        for row in ranking.sort_values("importance", ascending=False).itertuples(index=False)
    ]


def _plot_curves(
    y_true: np.ndarray,
    model_probabilities: dict[str, np.ndarray],
) -> tuple[dict[str, float], dict[str, float]]:
    roc_auc_scores: dict[str, float] = {}
    pr_auc_scores: dict[str, float] = {}

    roc_figure, roc_axis = plt.subplots(figsize=(8, 6))
    pr_figure, pr_axis = plt.subplots(figsize=(8, 6))

    palette = {
        "Rule-Based System": "#0f172a",
        "Logistic Regression": "#10b981",
        "Proposed GBDT": "#6366f1",
    }

    for label, probabilities in model_probabilities.items():
        roc_fpr, roc_tpr, _ = roc_curve(y_true, probabilities)
        pr_precision, pr_recall, _ = precision_recall_curve(y_true, probabilities)
        roc_auc_value = float(auc(roc_fpr, roc_tpr))
        pr_auc_value = float(auc(pr_recall, pr_precision))

        roc_auc_scores[label] = roc_auc_value
        pr_auc_scores[label] = pr_auc_value

        roc_axis.plot(roc_fpr, roc_tpr, label=f"{label} ({roc_auc_value:.3f})", color=palette[label], linewidth=2)
        pr_axis.plot(pr_recall, pr_precision, label=f"{label} ({pr_auc_value:.3f})", color=palette[label], linewidth=2)

    roc_axis.plot([0, 1], [0, 1], linestyle="--", color="#94a3b8", linewidth=1)
    roc_axis.set_title("ROC Curve Comparison")
    roc_axis.set_xlabel("False Positive Rate")
    roc_axis.set_ylabel("True Positive Rate")
    roc_axis.legend(frameon=False)
    roc_figure.tight_layout()
    roc_figure.savefig(REPORTS_DIR / "roc_curve.png", dpi=200)
    plt.close(roc_figure)

    pr_axis.set_title("Precision-Recall Curve")
    pr_axis.set_xlabel("Recall")
    pr_axis.set_ylabel("Precision")
    pr_axis.legend(frameon=False)
    pr_figure.tight_layout()
    pr_figure.savefig(REPORTS_DIR / "pr_curve.png", dpi=200)
    plt.close(pr_figure)

    return roc_auc_scores, pr_auc_scores


def main() -> None:
    ensure_directories()
    if not DATASET_PATH.exists():
        persist_dataset(generate_dataset_frame(), DATASET_PATH)

    dataset = pd.read_csv(DATASET_PATH)
    splits = prepare_splits(dataset=dataset, random_seed=42)

    rule_model = RuleBasedModel()
    lr_model = joblib.load(LR_MODEL_PATH)
    gbdt_model = joblib.load(GBDT_MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    threshold = _load_threshold()

    rule_probability = rule_model.predict_proba(splits.X_test_raw)[:, 1]
    lr_probability = lr_model.predict_proba(splits.X_test_scaled)[:, 1]
    gbdt_probability = gbdt_model.predict_proba(splits.X_test_scaled)[:, 1]

    results = {
        "Rule-Based System": evaluate_predictions(
            y_true=splits.y_test,
            predictions=(rule_probability >= 0.5).astype(int),
            fraud_probability=rule_probability,
        ),
        "Logistic Regression": evaluate_predictions(
            y_true=splits.y_test,
            predictions=(lr_probability >= 0.5).astype(int),
            fraud_probability=lr_probability,
        ),
        "Proposed GBDT": evaluate_predictions(
            y_true=splits.y_test,
            predictions=(gbdt_probability >= threshold).astype(int),
            fraud_probability=gbdt_probability,
        ),
    }

    feature_importances = _feature_importances(gbdt_model, splits.X_test_scaled, splits.y_test)
    feature_payload = _plot_feature_importance(feature_importances)
    roc_auc_scores, pr_auc_scores = _plot_curves(
        y_true=splits.y_test,
        model_probabilities={
            "Rule-Based System": rule_probability,
            "Logistic Regression": lr_probability,
            "Proposed GBDT": gbdt_probability,
        },
    )

    latency = benchmark_latency(gbdt_model, splits.X_test_scaled[:1], runs=1000)
    age_bins, age_edges = np.histogram(dataset["age"], bins=10)
    delay_bins, delay_edges = np.histogram(dataset["life_proof_delay"], bins=10)

    metrics_payload = {
        "generated_at": artifact_timestamp(),
        "selected_threshold": threshold,
        "targets": {
            "recall": 0.95,
            "accuracy": 0.95,
            "f1": 0.94,
            "latency_mean_ms": 5.0,
        },
        "performance_comparison": [
            {
                "model": label,
                "accuracy": round(metrics["accuracy"], 4),
                "precision": round(metrics["precision"], 4),
                "recall": round(metrics["recall"], 4),
                "f1": round(metrics["f1"], 4),
                "roc_auc": round(roc_auc_scores[label], 4),
                "pr_auc": round(pr_auc_scores[label], 4),
            }
            for label, metrics in results.items()
        ],
        "confusion_matrix": results["Proposed GBDT"]["confusion_matrix"],
        "paper_reference_confusion_matrix": {
            "tp": 8910,
            "fn": 460,
            "fp": 380,
            "tn": 3250,
        },
        "feature_importance": feature_payload,
        "latency_benchmark_ms": latency,
        "distribution": {
            "age": {
                "counts": age_bins.tolist(),
                "edges": [round(value, 2) for value in age_edges.tolist()],
            },
            "life_proof_delay": {
                "counts": delay_bins.tolist(),
                "edges": [round(value, 2) for value in delay_edges.tolist()],
            },
        },
        "artifacts": {
            "feature_importance_chart": str(REPORTS_DIR / "feature_importance.png"),
            "roc_curve_chart": str(REPORTS_DIR / "roc_curve.png"),
            "pr_curve_chart": str(REPORTS_DIR / "pr_curve.png"),
        },
        "using_scaler": str(type(scaler).__name__),
    }

    METRICS_PATH.write_text(json.dumps(metrics_payload, indent=2), encoding="utf-8")
    print(json.dumps(metrics_payload, indent=2))


if __name__ == "__main__":
    main()
