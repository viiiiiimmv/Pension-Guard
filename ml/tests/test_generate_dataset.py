from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from common import FEATURE_COLUMNS, generate_dataset_frame


def test_generate_dataset_is_reproducible() -> None:
    first = generate_dataset_frame(n_records=2_000, random_seed=42)
    second = generate_dataset_frame(n_records=2_000, random_seed=42)

    assert first.equals(second)
    assert list(first.columns) == ["pensioner_id", *FEATURE_COLUMNS, "eligibility_label"]

    fraud_ratio = float((1 - first["eligibility_label"]).mean())
    assert 0.12 <= fraud_ratio <= 0.15
    assert first["age"].between(55, 90).all()
    assert first["life_proof_delay"].between(0, 180).all()
