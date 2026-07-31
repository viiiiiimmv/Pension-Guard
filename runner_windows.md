# Runner Guide (Windows)

This file is the practical runbook for starting each part of the project and running the full pipeline end to end on Windows PowerShell.

Project root:

```powershell
cd d:\Projects\Pension-Guard
```

## 1. One-Time Setup

Create the local Python environment and install backend/ML dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt -r ml\requirements.txt
```

If PowerShell blocks script execution, run this once in the current session:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

Install frontend dependencies:

```powershell
cd frontend
npm install
cd ..
```

## 2. ML Directory

Move into the ML directory:

```powershell
cd ml
.\..\.venv\Scripts\Activate.ps1
```

### Generate the dataset

```powershell
python generate_dataset.py
```

Outputs:

- `ml/data/pensioners.csv`

### Train the models

```powershell
python train.py
```

Outputs:

- `ml/models/gbdt_model.joblib`
- `ml/models/lr_model.joblib`
- `ml/models/scaler.joblib`
- `ml/models/threshold.json`

### Generate evaluation reports

```powershell
$env:MPLCONFIGDIR = "$PWD\mpl-cache"
$env:XDG_CACHE_HOME = "$PWD\font-cache"
python evaluate.py
```

Outputs:

- `ml/reports/metrics.json`
- `ml/reports/feature_importance.png`
- `ml/reports/roc_curve.png`
- `ml/reports/pr_curve.png`

## 3. Backend Directory

Move into the backend directory:

```powershell
cd backend
.\..\.venv\Scripts\Activate.ps1
```

### Seed the database from the ML CSV

```powershell
python seed.py
```

### Start the backend API

```powershell
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

## 4. Frontend Directory

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

## 5. Full Local Pipeline

```powershell
cd d:\Projects\Pension-Guard
.\.venv\Scripts\Activate.ps1
cd ml
python generate_dataset.py
python train.py
$env:MPLCONFIGDIR = "$PWD\mpl-cache"
$env:XDG_CACHE_HOME = "$PWD\font-cache"
python evaluate.py
cd ..\backend
python seed.py
cd ..
```

## 6. Verification

```powershell
pytest ml/tests/test_generate_dataset.py backend/tests/test_inference.py
```

## 7. Docker Option

```powershell
docker-compose up --build
```
