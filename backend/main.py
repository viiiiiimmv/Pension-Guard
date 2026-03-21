from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import settings
from database import create_tables
from routers.auth import router as auth_router
from routers.analytics import router as analytics_router
from routers.pensioners import router as pensioners_router
from routers.predict import router as predict_router
from routers.reports import router as reports_router
from services.analytics import AnalyticsService
from services.auth import AuthService, AuthServiceError
from services.inference import InferenceService, ModelNotFoundError

REPORTS_DIR = Path(
    os.getenv("ML_REPORTS_PATH", str(settings.PROJECT_ROOT / "ml" / "reports" / "metrics.json"))
).resolve()
REPORTS_DIR = REPORTS_DIR.parent if REPORTS_DIR.suffix else REPORTS_DIR


def build_allowed_origins() -> list[str]:
    configured = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    origins = {
        origin.strip()
        for origin in configured.split(",")
        if origin.strip()
    }
    origins.update(
        {
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        }
    )
    return sorted(origins)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    app.state.analytics_service = AnalyticsService()
    app.state.auth_service = AuthService()
    app.state.inference_service = None
    app.state.model_error = None

    try:
        app.state.inference_service = InferenceService()
    except (ModelNotFoundError, Exception) as exc:
        app.state.model_error = str(exc)
    yield


app = FastAPI(
    title="PensionGuard AI",
    description="Smart Pension Distribution System backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=build_allowed_origins(),
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(pensioners_router)
app.include_router(predict_router)
app.include_router(analytics_router)
app.include_router(reports_router)


@app.exception_handler(ModelNotFoundError)
async def handle_model_not_found(_: Request, exc: ModelNotFoundError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"error": "ModelNotFoundError", "detail": str(exc)})


@app.exception_handler(AuthServiceError)
async def handle_auth_error(_: Request, exc: AuthServiceError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": "AuthServiceError", "detail": exc.detail})


@app.exception_handler(Exception)
async def handle_unexpected_error(_: Request, exc: Exception) -> JSONResponse:
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": "HttpError", "detail": exc.detail},
        )
    return JSONResponse(
        status_code=500,
        content={"error": "InternalServerError", "detail": str(exc)},
    )


@app.get("/api/health")
def health(request: Request) -> dict[str, object]:
    service = request.app.state.inference_service
    return {
        "status": "ok" if service else "degraded",
        "model_ready": bool(service and service.is_ready()),
        "model_error": request.app.state.model_error,
        "reports_dir": str(REPORTS_DIR),
    }
