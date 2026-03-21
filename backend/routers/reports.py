from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

import settings
from services.auth import AuthenticatedSession, require_authenticated_session

router = APIRouter(prefix="/api/reports", tags=["reports"])

metrics_path = Path(
    os.getenv("ML_REPORTS_PATH", str(settings.PROJECT_ROOT / "ml" / "reports" / "metrics.json"))
).resolve()
REPORTS_DIR = metrics_path.parent if metrics_path.suffix else metrics_path
ALLOWED_REPORTS = {"roc_curve.png", "pr_curve.png", "feature_importance.png"}


@router.get("/{filename}")
def get_report(filename: str, _: AuthenticatedSession = Depends(require_authenticated_session)) -> FileResponse:
    if filename not in ALLOWED_REPORTS:
        raise HTTPException(status_code=404, detail="Report not found")

    path = (REPORTS_DIR / filename).resolve()
    if not path.exists() or path.parent != REPORTS_DIR:
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(path)
