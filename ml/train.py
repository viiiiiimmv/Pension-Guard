from __future__ import annotations

import json

import pandas as pd

from common import (
    DATASET_PATH,
    FEATURE_COLUMNS,
    GBDT_MODEL_PATH,
    LR_MODEL_PATH,
    SCALER_PATH,
    THRESHOLD_PATH,
    build_gbdt_classifier,
    build_logistic_regression,
    ensure_directories,
    evaluate_predictions,
    generate_dataset_frame,
    optimize_threshold,
    persist_dataset,
    prepare_splits,
    save_training_artifacts,
)


def main() -> None:
    ensure_directories()
    if not DATASET_PATH.exists():
        persist_dataset(generate_dataset_frame(), DATASET_PATH)

    splits = prepare_splits(dataset=pd.read_csv(DATASET_PATH), random_seed=42)
    fraud_ratio_inverse = float((1 - splits.y_train.mean()) / max(splits.y_train.mean(), 1e-6))

    lr_model = build_logistic_regression(random_seed=42)
    gbdt_model = build_gbdt_classifier(scale_pos_weight=fraud_ratio_inverse, random_seed=42)

    lr_model.fit(splits.X_train_scaled, splits.y_train)
    gbdt_model.fit(splits.X_train_scaled, splits.y_train)

    validation_probability = gbdt_model.predict_proba(splits.X_val_scaled)[:, 1]
    threshold, selected_metrics = optimize_threshold(
        y_true=splits.y_val,
        fraud_probability=validation_probability,
        min_precision=0.85,
    )

    save_training_artifacts(gbdt_model=gbdt_model, lr_model=lr_model, scaler=splits.scaler, threshold=threshold)

    preview = {
        "threshold": threshold,
        "validation_selection_metrics": selected_metrics,
        "models": {
            "rule_based": "hard-coded threshold classifier",
            "logistic_regression": str(type(lr_model).__name__),
            "gbdt": str(type(gbdt_model).__name__),
        },
        "artifacts": {
            "gbdt_model": str(GBDT_MODEL_PATH),
            "lr_model": str(LR_MODEL_PATH),
            "scaler": str(SCALER_PATH),
            "threshold": str(THRESHOLD_PATH),
        },
        "features": FEATURE_COLUMNS,
    }

    test_probability = gbdt_model.predict_proba(splits.X_test_scaled)[:, 1]
    test_predictions = (test_probability >= threshold).astype(int)
    preview["test_preview"] = evaluate_predictions(
        y_true=splits.y_test,
        predictions=test_predictions,
        fraud_probability=test_probability,
    )

    print(json.dumps(preview, indent=2))


if __name__ == "__main__":
    main()
