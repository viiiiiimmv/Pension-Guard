from __future__ import annotations

import hashlib
import os
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

import settings  # noqa: F401
from database import get_db
from models.auth import AuthSession

bearer_scheme = HTTPBearer(auto_error=False)


def utc_now_naive() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class AuthServiceError(RuntimeError):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


@dataclass(slots=True)
class AuthenticatedSession:
    identity: str
    expires_at: datetime


class AuthService:
    def __init__(self) -> None:
        self.identity = os.getenv("AUTH_DISPLAY_NAME", "Officer Console").strip() or "Officer Console"
        self.passcode = os.getenv("AUTH_LOGIN_CODE", "").strip()
        self.token_secret = os.getenv("AUTH_TOKEN_SECRET", "").strip()
        self.session_ttl_hours = int(os.getenv("AUTH_SESSION_TTL_HOURS", "12"))

    def _ensure_auth_configured(self) -> None:
        if not self.token_secret:
            raise AuthServiceError(
                "AUTH_TOKEN_SECRET is not configured on the backend.",
                status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if not self.passcode:
            raise AuthServiceError(
                "AUTH_LOGIN_CODE is not configured on the backend.",
                status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if len(self.passcode) != 8 or not self.passcode.isdigit():
            raise AuthServiceError(
                "AUTH_LOGIN_CODE must be an 8-digit numeric value.",
                status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    def _hash_value(self, value: str) -> str:
        return hashlib.sha256(f"{value}:{self.token_secret}".encode("utf-8")).hexdigest()

    def _create_session_token(self) -> str:
        return secrets.token_urlsafe(48)

    def login(self, db: Session, passcode: str) -> dict[str, str | datetime]:
        self._ensure_auth_configured()
        now = utc_now_naive()
        expected_hash = self._hash_value(self.passcode)
        provided_hash = self._hash_value(passcode)
        if not secrets.compare_digest(provided_hash, expected_hash):
            raise AuthServiceError("Invalid access code.", status.HTTP_401_UNAUTHORIZED)

        raw_token = self._create_session_token()
        session = AuthSession(
            email=self.identity,
            token_hash=self._hash_value(raw_token),
            created_at=now,
            expires_at=now + timedelta(hours=self.session_ttl_hours),
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        return {
            "access_token": raw_token,
            "token_type": "bearer",
            "identity": session.email,
            "expires_at": session.expires_at,
        }

    def authenticate(self, db: Session, token: str) -> AuthSession:
        self._ensure_auth_configured()
        token_hash = self._hash_value(token)
        now = utc_now_naive()
        session = db.scalar(
            select(AuthSession).where(
                AuthSession.token_hash == token_hash,
                AuthSession.revoked_at.is_(None),
            )
        )
        if session is None or session.expires_at < now:
            if session is not None and session.revoked_at is None:
                session.revoked_at = now
                db.add(session)
                db.commit()
            raise AuthServiceError("Authentication required.", status.HTTP_401_UNAUTHORIZED)

        session.last_used_at = now
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def revoke_session(self, db: Session, token: str) -> None:
        token_hash = self._hash_value(token)
        session = db.scalar(select(AuthSession).where(AuthSession.token_hash == token_hash))
        if session is None:
            return
        session.revoked_at = utc_now_naive()
        db.add(session)
        db.commit()


def require_authenticated_session(
    request: Request,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthenticatedSession:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

    service: AuthService = request.app.state.auth_service
    session = service.authenticate(db, credentials.credentials)
    return AuthenticatedSession(identity=session.email, expires_at=session.expires_at)
