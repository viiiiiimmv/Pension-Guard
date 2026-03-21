from __future__ import annotations

from common import DATASET_PATH, generate_dataset_frame, persist_dataset


def main() -> None:
    frame = generate_dataset_frame(n_records=50_000, random_seed=42)
    summary = persist_dataset(frame, DATASET_PATH)
    print("Synthetic pensioner dataset generated")
    print(f"Records: {summary['records']}")
    print(f"Fraud ratio: {summary['fraud_ratio']:.4f}")
    print(f"Saved to: {summary['saved_to']}")


if __name__ == "__main__":
    main()
