# Smart Pension Distribution System

This project is a full-stack pension eligibility and fraud-detection system.

It simulates a government-style pension review workflow where:

1. A synthetic pensioner dataset is generated.
2. Machine learning models are trained to detect potentially fraudulent or ineligible cases.
3. A FastAPI backend serves predictions, analytics, and pensioner records.
4. A React dashboard allows an officer or reviewer to inspect records, run predictions, and view model performance.

If your goal is to learn this project, the shortest explanation is:

- `ml/` creates the data and the model
- `backend/` serves the model and the data
- `frontend/` gives you a UI to use the system

For command-by-command startup help, also see [runner.md](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/runner.md).

## What This Project Does

The system tries to answer one question:

`Should this pension record be treated as eligible, or should it be flagged for possible fraud/ineligibility?`

It does that by using six features for each pensioner:

- age
- life-proof delay
- bank activity count
- biometric status
- historical approval rate
- pension credit anomaly

The ML pipeline learns a fraud probability from these inputs.

The backend then:

- loads the trained model
- exposes prediction endpoints
- stores pensioner records in SQLite
- returns dashboard analytics
- serves the generated model report images

The frontend then lets a user:

- see high-level system metrics
- search and inspect pensioners
- submit one-off prediction requests
- review confusion matrix, ROC curve, and feature importance

## Architecture

```text
smart-pension-system/
├── ml/         -> dataset generation, training, evaluation, reports
├── backend/    -> FastAPI app, SQLite, CRUD, analytics, inference
├── frontend/   -> React + Tailwind dashboard
├── runner.md   -> operational runbook
└── README.md   -> learning and usage guide
```

## End-to-End Workflow

This is the full pipeline from raw generation to UI usage:

1. `ml/generate_dataset.py`
   Creates `50,000` synthetic pensioner records in `ml/data/pensioners.csv`
2. `ml/train.py`
   Trains the rule-based baseline, logistic regression baseline, and the main GBDT/XGBoost model
3. `ml/evaluate.py`
   Produces performance metrics and charts in `ml/reports/`
4. `backend/seed.py`
   Loads the CSV into SQLite and stores prediction outputs for all records
5. `backend/main.py`
   Starts the API and serves data/model insights
6. `frontend/`
   Calls the API and displays the system in a browser

## Main Outputs

After the project is run successfully, these are the important generated files:

### Dataset

- `ml/data/pensioners.csv`

### Trained model artifacts

- `ml/models/gbdt_model.joblib`
- `ml/models/lr_model.joblib`
- `ml/models/scaler.joblib`
- `ml/models/threshold.json`

### Evaluation reports

- `ml/reports/metrics.json`
- `ml/reports/feature_importance.png`
- `ml/reports/roc_curve.png`
- `ml/reports/pr_curve.png`

### Backend database

- `backend/pension.db`

## Project Modules

## ML Layer

The ML layer is responsible for building the intelligence in the system.

Important files:

- [ml/common.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/ml/common.py)
- [ml/generate_dataset.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/ml/generate_dataset.py)
- [ml/train.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/ml/train.py)
- [ml/evaluate.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/ml/evaluate.py)

What it does:

- generates a reproducible synthetic dataset
- keeps the fraud ratio in the required band
- trains three models
- chooses a decision threshold for the GBDT model
- measures accuracy, precision, recall, F1, ROC AUC, PR AUC, and latency
- saves images and metrics for the dashboard

The main model is the proposed GBDT/XGBoost classifier.

## Backend Layer

The backend is the service layer between the ML model and the frontend.

Important files:

- [backend/main.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/backend/main.py)
- [backend/database.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/backend/database.py)
- [backend/services/inference.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/backend/services/inference.py)
- [backend/services/analytics.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/backend/services/analytics.py)
- [backend/seed.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/backend/seed.py)

What it does:

- loads trained model artifacts at startup
- exposes API routes for pensioners, prediction, and analytics
- stores pension records in SQLite
- returns summary metrics to the frontend
- serves static report images from `ml/reports`

Main route groups:

- `/api/pensioners`
- `/api/predict`
- `/api/analytics`
- `/api/health`

OpenAPI docs:

- [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## Frontend Layer

The frontend is an officer-style admin dashboard.

Important files:

- [frontend/src/App.tsx](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/frontend/src/App.tsx)
- [frontend/src/api/client.ts](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/frontend/src/api/client.ts)
- [frontend/src/pages/Dashboard.tsx](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/frontend/src/pages/Dashboard.tsx)
- [frontend/src/pages/Pensioners.tsx](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/frontend/src/pages/Pensioners.tsx)
- [frontend/src/pages/Predict.tsx](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/frontend/src/pages/Predict.tsx)
- [frontend/src/pages/Analytics.tsx](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/frontend/src/pages/Analytics.tsx)

What it does:

- shows total eligible and flagged counts
- displays charts and performance comparisons
- lets you search pensioners
- lets you inspect a record in detail
- lets you submit a new single-record prediction
- shows feature importance and confusion matrix results

Main pages:

- `/` dashboard overview
- `/pensioners` pensioner table and record detail
- `/predict` manual prediction form
- `/analytics` model report view

## Setup

From the project root:

```bash
cd /Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system
```

Create the virtual environment and install Python dependencies:

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

## Environment Variables

This project mostly works with sensible defaults.

### Frontend `.env`

If you want to configure the frontend API base URL, create:

- [frontend/.env](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/frontend/.env)

Example:

```env
VITE_API_URL=http://127.0.0.1:8000
```

### Backend environment variables

The backend currently reads environment variables from the shell when it starts.

Supported variables:

- `DATABASE_URL`
- `FRONTEND_ORIGIN`
- `ML_MODELS_PATH`
- `ML_REPORTS_PATH`

Example start:

```bash
cd backend
source ../.venv/bin/activate
export DATABASE_URL="sqlite:///./pension.db"
export FRONTEND_ORIGIN="http://127.0.0.1:5173"
export ML_MODELS_PATH="../ml/models"
export ML_REPORTS_PATH="../ml/reports/metrics.json"
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

## How To Run the Project

## Step 1: Generate data and train the model

```bash
cd ml
source ../.venv/bin/activate
python generate_dataset.py
python train.py
MPLCONFIGDIR=/tmp/mpl-cache XDG_CACHE_HOME=/tmp/font-cache python evaluate.py
cd ..
```

## Step 2: Seed the database

```bash
cd backend
source ../.venv/bin/activate
python seed.py
cd ..
```

## Step 3: Start the backend

Open a terminal and run:

```bash
cd /Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/backend
source ../.venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Useful backend URLs:

- [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- [http://127.0.0.1:8000/api/analytics/summary](http://127.0.0.1:8000/api/analytics/summary)
- [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## Step 4: Start the frontend

Open a second terminal and run:

```bash
cd /Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Frontend URL:

- [http://127.0.0.1:5173](http://127.0.0.1:5173)

## How To Use the Project

Once both backend and frontend are running:

### Dashboard

Go to the home page and review:

- total pensioners
- eligible count
- flagged count
- average fraud probability
- model comparison chart
- eligibility distribution
- age and delay distributions

### Pensioners page

Use this page to:

- search by pensioner ID
- filter by eligible, flagged, or pending
- sort by age, delay, or fraud probability
- click a row to inspect full details

### Predict page

Use this page to:

- enter one record manually
- submit the features to the model
- see the eligibility decision
- see the fraud probability
- view the confidence label
- inspect the feature-level breakdown

### Analytics page

Use this page to:

- inspect the confusion matrix
- view the ROC curve image served by the backend
- review feature importance
- compare model performance metrics

## API Summary

Important endpoints:

- `GET /api/health`
- `GET /api/pensioners`
- `GET /api/pensioners/{pensioner_id}`
- `POST /api/pensioners`
- `PUT /api/pensioners/{pensioner_id}`
- `DELETE /api/pensioners/{pensioner_id}`
- `POST /api/predict`
- `POST /api/predict/batch`
- `GET /api/analytics/summary`
- `GET /api/analytics/metrics`
- `GET /api/analytics/confusion`
- `GET /api/analytics/features`
- `GET /api/analytics/distribution`

## How To Learn This Codebase

If you want to understand the project step by step, use this order:

1. Read [ml/common.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/ml/common.py)
   This explains the data features, model setup, thresholding, and metric helpers.
2. Read [ml/train.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/ml/train.py)
   This shows the actual model training flow.
3. Read [backend/services/inference.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/backend/services/inference.py)
   This is the bridge between the saved model and the API.
4. Read [backend/main.py](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/backend/main.py)
   This shows how the backend app starts and loads services.
5. Read [frontend/src/api/client.ts](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/frontend/src/api/client.ts)
   This shows how the UI talks to the backend.
6. Read [frontend/src/App.tsx](/Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/frontend/src/App.tsx)
   This shows the layout and routing.

## Testing

From the project root:

```bash
source .venv/bin/activate
pytest ml/tests/test_generate_dataset.py backend/tests/test_inference.py
```

Frontend build test:

```bash
cd frontend
npm run build
```

## Docker

You can also run the stack with Docker:

```bash
docker-compose up --build
```

## Troubleshooting

### The backend says model artifacts are missing

Re-run:

```bash
cd ml
source ../.venv/bin/activate
python generate_dataset.py
python train.py
MPLCONFIGDIR=/tmp/mpl-cache XDG_CACHE_HOME=/tmp/font-cache python evaluate.py
```

### The frontend loads but shows API errors

Make sure:

- the backend is running on `127.0.0.1:8000`
- `VITE_API_URL` points to the backend

### The analytics images are missing

Make sure:

- `ml/reports/feature_importance.png`
- `ml/reports/roc_curve.png`
- `ml/reports/pr_curve.png`
- `ml/reports/metrics.json`

all exist before starting the backend.

## Quick Summary

If you only want the shortest usage flow:

```bash
cd /Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system
source .venv/bin/activate
cd ml && python generate_dataset.py && python train.py && MPLCONFIGDIR=/tmp/mpl-cache XDG_CACHE_HOME=/tmp/font-cache python evaluate.py && cd ..
cd backend && python seed.py && cd ..
```

Then open two terminals:

Terminal 1:

```bash
cd /Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/backend
source ../.venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Terminal 2:

```bash
cd /Users/shivchauhan/Projects/SEMESTER-8/smart-pension-system/frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Then visit:

- [http://127.0.0.1:5173](http://127.0.0.1:5173)
