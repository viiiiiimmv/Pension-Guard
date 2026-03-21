<div align="center">

<img src="https://img.shields.io/badge/Pension_Guard-v1.0-0f172a?style=for-the-badge&logo=shield&logoColor=white" alt="Pension Guard" height="40"/>

# 🛡️ Pension Guard

### Smart Pension Distribution & Fraud Detection System

*A full-stack, ML-powered government-style pension review platform — from synthetic data generation to an interactive officer dashboard.*

<br/>

[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-FF6600?style=for-the-badge&logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)](https://scikit-learn.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![pytest](https://img.shields.io/badge/pytest-0A9EDC?style=for-the-badge&logo=pytest&logoColor=white)](https://pytest.org)

<br/>

![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/status-active-brightgreen?style=flat-square)
![ML Model](https://img.shields.io/badge/model-GBDT%2FXGBoost-orange?style=flat-square)
![Dataset](https://img.shields.io/badge/dataset-50%2C000%20records-blue?style=flat-square)

</div>

---

## 📖 What Is Pension Guard?

Pension Guard simulates a **government-grade pension review workflow**. It generates a synthetic pensioner dataset, trains machine learning models to detect fraudulent or ineligible cases, exposes a FastAPI backend for predictions and analytics, and presents everything through a React officer dashboard.

> **Core question the system answers:**
> *Should this pension record be treated as eligible, or flagged for possible fraud/ineligibility?*

---

## 🗺️ Repository Map

```
pension-guard/
├── ml/               ← dataset generation, model training, evaluation & reports
│   ├── common.py
│   ├── generate_dataset.py
│   ├── train.py
│   ├── evaluate.py
│   ├── data/         ← pensioners.csv (generated)
│   ├── models/       ← .joblib artifacts (generated)
│   ├── reports/      ← charts & metrics (generated)
│   └── tests/
│
├── backend/          ← FastAPI app, SQLite, CRUD, inference, analytics
│   ├── main.py
│   ├── database.py
│   ├── seed.py
│   ├── services/
│   │   ├── inference.py
│   │   └── analytics.py
│   ├── tests/
│   └── requirements.txt
│
├── frontend/         ← React + TypeScript + Tailwind dashboard
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api/client.ts
│   │   └── pages/
│   │       ├── Dashboard.tsx
│   │       ├── Pensioners.tsx
│   │       ├── Predict.tsx
│   │       └── Analytics.tsx
│   ├── .env
│   └── package.json
│
├── docker-compose.yml
├── runner.md         ← operational runbook
└── README.md
```

---

## 🧠 How It Works

### Six Features Per Pensioner

| Feature | Description |
|---|---|
| `age` | Pensioner's age |
| `life_proof_delay` | Days delay in submitting life certificate |
| `bank_activity_count` | Recent banking transactions count |
| `biometric_status` | Biometric verification flag |
| `historical_approval_rate` | Past approval ratio for this record |
| `pension_credit_anomaly` | Anomaly score in credit disbursement |

### Three Models Compared

| Model | Role |
|---|---|
| Rule-based baseline | Heuristic threshold classifier |
| Logistic Regression | Statistical baseline |
| **GBDT / XGBoost** ✅ | **Primary model — best performance** |

### End-to-End Pipeline

```
generate_dataset.py  →  train.py  →  evaluate.py
        ↓                                ↓
  pensioners.csv              reports/ (charts + metrics)
        ↓
     seed.py  →  pension.db
        ↓
     main.py  (FastAPI on :8000)
        ↓
  React Dashboard (Vite on :5173)
```

---

## ⚙️ Prerequisites

Make sure you have the following installed before starting:

| Tool | Version | Install |
|---|---|---|
| Python | ≥ 3.10 | [python.org](https://python.org) |
| Node.js | ≥ 18.x | [nodejs.org](https://nodejs.org) |
| npm | ≥ 9.x | Bundled with Node.js |
| Docker *(optional)* | any | [docker.com](https://docker.com) |

---

## 🚀 Setup & Installation

### 1 — Clone the repository

```bash
git clone https://github.com/viiiiiimmv/Pension-Guard.git
cd Pension-Guard
```

### 2 — Create Python virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate          # macOS / Linux
# .venv\Scripts\activate           # Windows
```

### 3 — Install Python dependencies

```bash
pip install -r backend/requirements.txt -r ml/requirements.txt
```

### 4 — Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 5 — Configure environment variables

**Frontend** — create `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

**Backend** — set these before starting the server (or export them in your shell profile):

```bash
export DATABASE_URL="sqlite:///./pension.db"
export FRONTEND_ORIGIN="http://127.0.0.1:5173"
export ML_MODELS_PATH="../ml/models"
export ML_REPORTS_PATH="../ml/reports/metrics.json"
```

> 💡 All variables have sensible defaults — they only need to be set if you want to override paths or origins.

---

## ▶️ Running the Project

Run these steps **in order** from the project root.

### Step 1 — Generate data & train the model

```bash
cd ml
source ../.venv/bin/activate

python generate_dataset.py   # creates ml/data/pensioners.csv (50,000 records)
python train.py              # trains GBDT, LR, and rule-based models
MPLCONFIGDIR=/tmp/mpl-cache XDG_CACHE_HOME=/tmp/font-cache python evaluate.py
# ↑ generates ml/reports/ charts and metrics.json

cd ..
```

### Step 2 — Seed the database

```bash
cd backend
source ../.venv/bin/activate
python seed.py               # loads CSV into SQLite (pension.db)
cd ..
```

### Step 3 — Start the backend *(Terminal 1)*

```bash
cd backend
source ../.venv/bin/activate

export DATABASE_URL="sqlite:///./pension.db"
export FRONTEND_ORIGIN="http://127.0.0.1:5173"
export ML_MODELS_PATH="../ml/models"
export ML_REPORTS_PATH="../ml/reports/metrics.json"

uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Verify it's running:

| URL | What you'll see |
|---|---|
| `http://127.0.0.1:8000/api/health` | `{"status":"ok"}` |
| `http://127.0.0.1:8000/api/analytics/summary` | Summary metrics JSON |
| `http://127.0.0.1:8000/docs` | Interactive Swagger UI |

### Step 4 — Start the frontend *(Terminal 2)*

```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Open **[http://127.0.0.1:5173](http://127.0.0.1:5173)** in your browser.

---

## ⚡ Quick-Start (One-liner)

If you've already done setup once and just want to relaunch:

```bash
# From project root — ML pipeline
source .venv/bin/activate
cd ml && python generate_dataset.py && python train.py && \
  MPLCONFIGDIR=/tmp/mpl-cache XDG_CACHE_HOME=/tmp/font-cache python evaluate.py && cd ..
cd backend && python seed.py && cd ..
```

Then open two terminals as described in Steps 3 & 4 above.

---

## 🐳 Docker (Alternative)

Run the entire stack with a single command:

```bash
docker-compose up --build
```

No manual virtualenv or npm steps needed.

---

## 🖥️ Using the Dashboard

### 🏠 Dashboard (`/`)
- Total pensioners, eligible count, flagged count
- Average fraud probability
- Model comparison chart
- Age and delay distributions

### 👥 Pensioners (`/pensioners`)
- Search by pensioner ID
- Filter by `eligible` / `flagged` / `pending`
- Sort by age, delay, or fraud probability
- Click any row to view full record details

### 🔍 Predict (`/predict`)
- Enter a single record's features manually
- Submit to the GBDT model
- See eligibility decision, fraud probability, and confidence label
- Inspect per-feature breakdown

### 📊 Analytics (`/analytics`)
- Confusion matrix
- ROC curve image
- Feature importance chart
- Side-by-side model performance comparison

---

## 🔌 API Reference

Base URL: `http://127.0.0.1:8000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/pensioners` | List all pensioners |
| `GET` | `/api/pensioners/{id}` | Get single record |
| `POST` | `/api/pensioners` | Create record |
| `PUT` | `/api/pensioners/{id}` | Update record |
| `DELETE` | `/api/pensioners/{id}` | Delete record |
| `POST` | `/api/predict` | Single prediction |
| `POST` | `/api/predict/batch` | Batch prediction |
| `GET` | `/api/analytics/summary` | Dashboard metrics |
| `GET` | `/api/analytics/metrics` | Model metrics |
| `GET` | `/api/analytics/confusion` | Confusion matrix data |
| `GET` | `/api/analytics/features` | Feature importances |
| `GET` | `/api/analytics/distribution` | Score distributions |

> Full interactive docs: **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

---

## 📦 Generated Artifacts

After a full run, these files will exist:

```
ml/data/
  └── pensioners.csv              ← 50,000 synthetic records

ml/models/
  ├── gbdt_model.joblib           ← primary XGBoost model
  ├── lr_model.joblib             ← logistic regression baseline
  ├── scaler.joblib               ← feature scaler
  └── threshold.json              ← optimal decision threshold

ml/reports/
  ├── metrics.json
  ├── feature_importance.png
  ├── roc_curve.png
  └── pr_curve.png

backend/
  └── pension.db                  ← seeded SQLite database
```

---

## 🧪 Tests

```bash
# From project root
source .venv/bin/activate
pytest ml/tests/test_generate_dataset.py backend/tests/test_inference.py
```

Frontend build check:

```bash
cd frontend
npm run build
```

---

## 📚 Learning the Codebase

If you're new to the project, read files in this order:

| Step | File | Why |
|---|---|---|
| 1 | `ml/common.py` | Features, model config, thresholding, metric helpers |
| 2 | `ml/train.py` | Full model training flow |
| 3 | `backend/services/inference.py` | Bridge between saved model and API |
| 4 | `backend/main.py` | How the backend starts and wires services |
| 5 | `frontend/src/api/client.ts` | How the UI calls the backend |
| 6 | `frontend/src/App.tsx` | Layout, routing, and page structure |

---

## 🐛 Troubleshooting

<details>
<summary><strong>Backend says model artifacts are missing</strong></summary>

Re-run the ML pipeline:

```bash
cd ml
source ../.venv/bin/activate
python generate_dataset.py
python train.py
MPLCONFIGDIR=/tmp/mpl-cache XDG_CACHE_HOME=/tmp/font-cache python evaluate.py
```
</details>

<details>
<summary><strong>Frontend loads but shows API errors</strong></summary>

- Confirm the backend is running on `http://127.0.0.1:8000`
- Confirm `VITE_API_URL=http://127.0.0.1:8000` is set in `frontend/.env`
- Check for CORS errors in the browser console — set `FRONTEND_ORIGIN` correctly on the backend
</details>

<details>
<summary><strong>Analytics images are missing on the dashboard</strong></summary>

These files must exist before starting the backend:

```
ml/reports/feature_importance.png
ml/reports/roc_curve.png
ml/reports/pr_curve.png
ml/reports/metrics.json
```

Run `evaluate.py` again if any are absent.
</details>

<details>
<summary><strong>Port already in use</strong></summary>

Kill existing processes and retry:

```bash
# Backend
lsof -ti:8000 | xargs kill -9

# Frontend
lsof -ti:5173 | xargs kill -9
```
</details>

---

## 🏗️ Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| **ML / Data** | ![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white) ![XGBoost](https://img.shields.io/badge/XGBoost-FF6600?style=flat-square&logo=xgboost&logoColor=white) ![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikitlearn&logoColor=white) ![pandas](https://img.shields.io/badge/pandas-150458?style=flat-square&logo=pandas&logoColor=white) ![NumPy](https://img.shields.io/badge/NumPy-013243?style=flat-square&logo=numpy&logoColor=white) |
| **Backend** | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) ![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white) ![Uvicorn](https://img.shields.io/badge/Uvicorn-4051B5?style=flat-square&logo=gunicorn&logoColor=white) |
| **Frontend** | ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) |
| **Testing** | ![pytest](https://img.shields.io/badge/pytest-0A9EDC?style=flat-square&logo=pytest&logoColor=white) |
| **DevOps** | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) |

</div>

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">
  <sub>Built with ☕ as part of Semester 8 capstone work.</sub>
</div>