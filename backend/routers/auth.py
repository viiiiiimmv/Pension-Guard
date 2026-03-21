from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from models.schemas import AuthSessionResponse, PasswordLoginPayload, TokenResponse
from services.auth import AuthenticatedSession, require_authenticated_session

router = APIRouter(prefix="/api/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)


@router.post("/login", response_model=TokenResponse)
def login(payload: PasswordLoginPayload, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    service = request.app.state.auth_service
    response = service.login(db, payload.passcode)
    return TokenResponse(**response)


@router.get("/me", response_model=AuthSessionResponse)
def me(session: AuthenticatedSession = Depends(require_authenticated_session)) -> AuthSessionResponse:
    return AuthSessionResponse(identity=session.identity, expires_at=session.expires_at)


@router.post("/logout", status_code=204)
def logout(
    request: Request,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    _: AuthenticatedSession = Depends(require_authenticated_session),
) -> None:
    if credentials is None:
        return
    request.app.state.auth_service.revoke_session(db, credentials.credentials)
