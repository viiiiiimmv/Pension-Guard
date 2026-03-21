# Runner Guide

This file is the practical runbook for starting each part of the project and running the full pipeline end to end.

Project root:

```bash
cd /Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system
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

Output:

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

Run this after the ML dataset and model artifacts exist:

```bash
python seed.py
```

Output:

- `backend/pension.db`

### Start the backend API

```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Backend URLs:

- API health: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- OpenAPI docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ROC image: [http://127.0.0.1:8000/static/roc_curve.png](http://127.0.0.1:8000/static/roc_curve.png)

Quick check:

```bash
curl http://127.0.0.1:8000/api/health
```

## 4. Frontend Directory

Move into the frontend directory:

```bash
cd frontend
```

### Start the frontend dev server

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Frontend URL:

- Dashboard: [http://127.0.0.1:5173](http://127.0.0.1:5173)

Notes:

- The frontend expects the backend at `http://localhost:8000`
- Start the backend first before opening the UI

### Production build

```bash
npm run build
```

## 5. Full Local Pipeline

If you want to run everything in the correct order from scratch:

```bash
cd /Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system
source .venv/bin/activate
```

### Step A: ML pipeline

```bash
cd ml
python generate_dataset.py
python train.py
MPLCONFIGDIR=/tmp/mpl-cache XDG_CACHE_HOME=/tmp/font-cache python evaluate.py
cd ..
```

### Step B: Seed backend data

```bash
cd backend
python seed.py
cd ..
```

### Step C: Start backend

Open terminal 1:

```bash
cd /Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/backend
source ../.venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Step D: Start frontend

Open terminal 2:

```bash
cd /Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

## 6. Fast Verification Commands

From the project root:

```bash
source .venv/bin/activate
pytest ml/tests/test_generate_dataset.py backend/tests/test_inference.py
```

Frontend build check:

```bash
cd frontend
npm run build
```

Backend live check:

```bash
curl http://127.0.0.1:8000/api/analytics/summary
curl http://127.0.0.1:8000/api/analytics/metrics
```

## 7. Docker Option

If you prefer Docker:

```bash
docker-compose up --build
```

## 8. Dependency Order

Use this order whenever you are starting from a clean state:

1. Create/activate `.venv`
2. Install Python dependencies
3. Install frontend dependencies
4. Generate ML dataset
5. Train ML models
6. Generate ML evaluation reports
7. Seed backend database
8. Start backend
9. Start frontend

## 9. If Something Fails

### Missing model artifacts

Re-run:

```bash
cd ml
source ../.venv/bin/activate
python generate_dataset.py
python train.py
MPLCONFIGDIR=/tmp/mpl-cache XDG_CACHE_HOME=/tmp/font-cache python evaluate.py
```

### Backend starts but says model is not ready

Check these files exist:

- `ml/models/gbdt_model.joblib`
- `ml/models/lr_model.joblib`
- `ml/models/scaler.joblib`
- `ml/models/threshold.json`
- `ml/reports/metrics.json`

### Frontend loads but shows API errors

Make sure the backend is running on:

- `http://127.0.0.1:8000`

and then refresh the browser.
