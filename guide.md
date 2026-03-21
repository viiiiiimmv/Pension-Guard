# Model Factor Guide

This document explains how the prediction model uses each input factor in the Smart Pension Distribution System.

## What The Model Is Doing

The project predicts whether a pensioner record should be treated as:

- `Eligible`
- `Flagged`

Internally, the backend model produces a `fraud_probability`.

- If `fraud_probability < 0.31`, the record is treated as `Eligible`
- If `fraud_probability >= 0.31`, the record is treated as `Flagged`

The current threshold comes from [ml/models/threshold.json](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/ml/models/threshold.json).

## Input Factors Used By The Model

The model uses these 6 features:

1. `age`
2. `life_proof_delay`
3. `bank_activity_count`
4. `biometric_status`
5. `historical_approval_rate`
6. `pension_credit_anomaly`

These same fields are used in:

- the ML training pipeline: [ml/common.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/ml/common.py)
- live prediction: [backend/services/inference.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/backend/services/inference.py)
- the prediction form on the frontend

## Valid Input Ranges

These are the accepted ranges in the backend schema:

| Factor | Meaning | Valid range |
|---|---|---|
| `age` | Pensioner age | `55` to `90` |
| `life_proof_delay` | Delay in life-proof submission | `0` to `180` days |
| `bank_activity_count` | Count of recent bank activity events | `0` to `30` |
| `biometric_status` | Whether biometric verification passed | `0` or `1` |
| `historical_approval_rate` | Past approval consistency | `0.0` to `1.0` |
| `pension_credit_anomaly` | Whether suspicious pension credit activity exists | `0` or `1` |

## How Each Factor Affects Risk

### 1. Age

What it means:
- Higher age can slightly increase review risk in this synthetic pension-fraud setup.

How the model uses it:
- In the decision breakdown, age only starts adding noticeable risk after roughly `72`.
- Its contribution is the smallest among the six features in the trained model.

Practical interpretation:
- `60` to `70` usually has little risk effect by itself.
- `80+` can add some risk, but usually not enough alone to flag a case.

### 2. Life-Proof Delay

What it means:
- How late the pensioner is in completing the required life-proof verification.

How the model uses it:
- Higher delay increases risk.
- In the baseline rule-based system, delay above `45` days is treated as a strong warning sign.
- In the ML model, this is continuous, so risk rises gradually as delay increases.

Practical interpretation:
- `0` to `15` days is usually low-risk.
- `30` to `60` days becomes more concerning.
- Very large delays strongly push the record toward `Flagged`.

### 3. Bank Activity Count

What it means:
- A rough signal of whether the pension-linked bank account is showing normal activity.

How the model uses it:
- Lower bank activity increases risk.
- Very low counts suggest inactivity, dormant usage, or suspicious payout behavior.
- In the rule-based baseline, bank activity below `2` is a hard warning.

Practical interpretation:
- `8` to `15` is generally safer.
- `0`, `1`, or `2` raises risk significantly.
- This factor matters more when combined with biometric failure or anomaly flags.

### 4. Biometric Status

What it means:
- Whether biometric verification passed.

Values:
- `1` = passed
- `0` = failed or missing

How the model uses it:
- This is one of the strongest factors in the trained model.
- Failed biometric verification sharply increases risk.
- Passed biometric verification acts as a protective factor.

Practical interpretation:
- `1` strongly helps the record look normal.
- `0` is one of the fastest ways to move a case toward `Flagged`.

### 5. Historical Approval Rate

What it means:
- A proxy for how consistently the pensioner or record type has been approved in the past.

How the model uses it:
- Lower approval rate increases risk.
- Higher approval rate reduces risk.
- In the feature breakdown, values above about `0.8` are treated as protective.

Practical interpretation:
- `0.85` to `1.0` usually helps the case.
- `0.50` to `0.70` is moderate.
- Very low values like `0.10` or `0.20` increase suspicion.

### 6. Pension Credit Anomaly

What it means:
- Whether the system detected suspicious pension credit behavior.

Values:
- `1` = anomaly present
- `0` = no anomaly

How the model uses it:
- This is another very strong factor.
- If anomaly is present, risk rises sharply.
- In the rule-based baseline, this is also a hard warning signal.

Practical interpretation:
- `0` is normal.
- `1` strongly pushes the case toward `Flagged`, especially when combined with low bank activity or biometric failure.

## Relative Importance In The Trained Model

Based on [ml/reports/metrics.json](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/ml/reports/metrics.json), the trained model gives the most importance to:

1. `biometric_status`
2. `pension_credit_anomaly`
3. `bank_activity_count`
4. `historical_approval_rate`
5. `life_proof_delay`
6. `age`

This means:
- biometric failure and anomaly presence are the strongest fraud signals
- age matters the least on its own

## How The Factors Were Used During Training

The dataset generation logic in [ml/common.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/ml/common.py) creates a synthetic fraud-risk score using all six factors.

In simple terms:

- higher `life_proof_delay` increases risk
- lower `bank_activity_count` increases risk
- `biometric_status = 0` increases risk a lot
- lower `historical_approval_rate` increases risk
- `pension_credit_anomaly = 1` increases risk a lot
- higher `age` adds a smaller amount of risk

Then the generated fraud score is converted into labels:

- low risk -> `Eligible`
- high risk -> `Flagged`

The final deployed model learns these patterns from the generated data instead of using only hard-coded rules.

## How The Backend Uses These Factors At Prediction Time

During live prediction:

1. The backend collects the six input values
2. It arranges them in this exact order:
   - `age`
   - `life_proof_delay`
   - `bank_activity_count`
   - `biometric_status`
   - `historical_approval_rate`
   - `pension_credit_anomaly`
3. The values are scaled with `StandardScaler`
4. The trained GBDT/XGBoost model produces `fraud_probability`
5. The threshold `0.31` decides `Eligible` vs `Flagged`

Source: [backend/services/inference.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/backend/services/inference.py)

## How The Decision Card Breakdown Works

The decision card shown in the UI is not a full SHAP explanation. It is a simplified contribution view based on business-friendly heuristics in [backend/services/inference.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/backend/services/inference.py).

That breakdown roughly treats:

- higher delay as more risky
- anomaly presence as highly risky
- biometric failure as highly risky
- low bank activity as risky
- low approval rate as risky
- older age as mildly risky

This is meant to make the result understandable to users, even though the model itself is doing the final classification.

## Quick Testing Logic

Use this mental rule while testing the prediction form:

- Safe-looking case:
  - low delay
  - good bank activity
  - biometric passed
  - high approval rate
  - no anomaly

- Risky-looking case:
  - high delay
  - low bank activity
  - biometric failed
  - low approval rate
  - anomaly present

Examples:

### Likely Eligible

```text
age = 67
life_proof_delay = 18
bank_activity_count = 9
biometric_status = 1
historical_approval_rate = 0.84
pension_credit_anomaly = 0
```

### Likely Flagged

```text
age = 79
life_proof_delay = 95
bank_activity_count = 1
biometric_status = 0
historical_approval_rate = 0.32
pension_credit_anomaly = 1
```

## In Short

If you want to understand the model fast, remember this:

- `biometric_status` and `pension_credit_anomaly` matter the most
- `bank_activity_count` and `historical_approval_rate` are strong supporting signals
- `life_proof_delay` steadily increases risk as it gets larger
- `age` matters, but it is the weakest feature in the final model

## Main Reference Files

- [ml/common.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/ml/common.py)
- [backend/services/inference.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/backend/services/inference.py)
- [ml/reports/metrics.json](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/ml/reports/metrics.json)
- [ml/models/threshold.json](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/ml/models/threshold.json)
