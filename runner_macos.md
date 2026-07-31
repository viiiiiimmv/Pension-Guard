# Runner Guide (macOS/Linux)

This file is the practical runbook for starting each part of the project and running the full pipeline end to end on macOS or Linux.

Project root:

```bash
cd /path/to/Pension-Guard
```

## 1. One-Time Setup

Create the local Python environment and install backend/ML dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt -r ml/requirements.txt
```

Install frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

## 2. ML Directory

Move into the ML directory:

```bash
cd ml
source ../.venv/bin/activate
```

### Generate the dataset

```bash
python generate_dataset.py
```

Outputs:

- `ml/data/pensioners.csv`

### Train the models

```bash
python train.py
```

Outputs:

- `ml/models/gbdt_model.joblib`
- `ml/models/lr_model.joblib`
- `ml/models/scaler.joblib`
- `ml/models/threshold.json`

### Generate evaluation reports

```bash
MPLCONFIGDIR=/tmp/mpl-cache XDG_CACHE_HOME=/tmp/font-cache python evaluate.py
```

Outputs:

- `ml/reports/metrics.json`
- `ml/reports/feature_importance.png`
- `ml/reports/roc_curve.png`
- `ml/reports/pr_curve.png`

## 3. Backend Directory

Move into the backend directory:

```bash
cd backend
source ../.venv/bin/activate
```

### Seed the database from the ML CSV

```bash
python seed.py
```

### Start the backend API

```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

## 4. Frontend Directory

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

## 5. Full Local Pipeline

```bash
cd /path/to/Pension-Guard
source .venv/bin/activate
cd ml
python generate_dataset.py
python train.py
MPLCONFIGDIR=/tmp/mpl-cache XDG_CACHE_HOME=/tmp/font-cache python evaluate.py
cd ../backend
python seed.py
cd ..
```

## 6. Verification

```bash
pytest ml/tests/test_generate_dataset.py backend/tests/test_inference.py
```

## 7. Docker Option

```bash
docker-compose up --build
```
