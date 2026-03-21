from __future__ import annotations

import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from database import Base
from models.auth import AuthSession
from services.auth import AuthService, AuthServiceError


def build_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    return TestingSession()


def test_auth_service_logs_in_with_configured_passcode(monkeypatch) -> None:
    db = build_session()
    monkeypatch.setenv("AUTH_TOKEN_SECRET", "test-secret")
    monkeypatch.setenv("AUTH_LOGIN_CODE", "12345678")
    monkeypatch.setenv("AUTH_DISPLAY_NAME", "Officer Console")

    service = AuthService()

    login_response = service.login(db, "12345678")
    assert login_response["identity"] == "Officer Console"
    assert login_response["access_token"]
    assert db.query(AuthSession).count() == 1

    session = service.authenticate(db, str(login_response["access_token"]))
    assert session.email == "Officer Console"


def test_auth_service_rejects_invalid_passcode(monkeypatch) -> None:
    db = build_session()
    monkeypatch.setenv("AUTH_TOKEN_SECRET", "test-secret")
    monkeypatch.setenv("AUTH_LOGIN_CODE", "12345678")

    service = AuthService()

    with pytest.raises(AuthServiceError):
        service.login(db, "87654321")
