import base64
import hashlib
import hmac
import os
import secrets
import time
from pathlib import Path

from dotenv import dotenv_values
from sqlalchemy.engine import make_url

BACKEND = Path(__file__).resolve().parent.parent
TEST_DB_NAME = "veilix_test"


def _test_database_url() -> str:
    explicit = os.environ.get("TEST_DATABASE_URL")
    if explicit:
        return explicit
    source = os.environ.get("DATABASE_URL") or dotenv_values(BACKEND.parent / ".env", encoding="utf-8-sig").get("DATABASE_URL")
    if not source:
        raise RuntimeError("Définir TEST_DATABASE_URL ou DATABASE_URL pour lancer les tests.")
    return make_url(source).set(database=TEST_DB_NAME).render_as_string(hide_password=False)


TEST_SIGNING_KEY = secrets.token_hex(32)

os.environ.update({
    "DATABASE_URL": _test_database_url(),
    "APP_ENV": "development",
    "ENCRYPTION_KEY": base64.urlsafe_b64encode(secrets.token_bytes(32)).decode(),
    "HMAC_SECRET": secrets.token_hex(32),
    "MAILGUN_SIGNING_KEY": TEST_SIGNING_KEY,
    "MAILGUN_API_KEY": "cle-de-test",
    "MAILGUN_DOMAIN": "mg.veilix-tests.fr",
    "MAILGUN_API_URL": "https://mailgun.invalid",
    "EMAIL_PROVIDER": "mailgun",
    "DOMAIN": "alias.veilix-tests.fr",
    "FRONTEND_URL": "https://app.veilix.test",
    "CORS_ORIGINS": "https://app.veilix.test",
    "ADMIN_KEY_IDS": "",
    "REPLY_DOMAIN": "mg.veilix-tests.fr",
    "BETA_SCHEDULER_ENABLED": "false",
    "BETA_PRIVATE_OPENS_AT": "",
    "BETA_PRIVATE_SIGNUPS_CLOSE_AT": "",
    "BETA_PRIVATE_ENDS_AT": "",
    "BETA_PUBLIC_OPENS_AT": "",
    "BETA_PUBLIC_SIGNUPS_CLOSE_AT": "",
    "BETA_PUBLIC_ENDS_AT": "",
})

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text


@pytest.fixture(scope="session", autouse=True)
def base_de_test():
    url = make_url(os.environ["DATABASE_URL"])
    if "test" not in (url.database or ""):
        raise RuntimeError(f"Refus de lancer les tests sur la base « {url.database} » : son nom doit contenir « test ».")
    admin = create_engine(url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin.connect() as conn:
        conn.execute(text(f'DROP DATABASE IF EXISTS "{url.database}" WITH (FORCE)'))
        conn.execute(text(f'CREATE DATABASE "{url.database}"'))
    command.upgrade(Config(str(BACKEND / "alembic.ini")), "head")
    yield
    from app.db.session import engine
    engine.dispose()
    with admin.connect() as conn:
        conn.execute(text(f'DROP DATABASE IF EXISTS "{url.database}" WITH (FORCE)'))
    admin.dispose()


@pytest.fixture(autouse=True)
def etat_propre(base_de_test):
    from app.db.session import engine

    with engine.begin() as conn:
        conn.execute(text("TRUNCATE beta_feedback, access_codes, beta_signups, destination_verifications, aliases, keys, rate_limits, webhook_tokens RESTART IDENTITY CASCADE"))
    yield


@pytest.fixture
def emails(monkeypatch):
    envoyes: list[dict] = []
    from app.services import email_service

    def capturer(data, files=None):
        envoyes.append({**data, "_files": list(files or [])})

    monkeypatch.setattr(email_service, "_post_mailgun", capturer)
    return envoyes


@pytest.fixture
def client(emails):
    from app.main import app

    return TestClient(app)


@pytest.fixture
def db():
    from app.db.session import SessionLocal

    session = SessionLocal()
    yield session
    session.close()


def nouvelle_cle() -> str:
    return secrets.token_hex(32)


def entetes(key_id: str) -> dict:
    return {"X-Veilix-Key-Id": key_id}


def code_d_acces(phase: str = "private", jours: int = 30) -> str:
    from app.db.session import SessionLocal
    from app.services.access_service import generate_codes

    session = SessionLocal()
    try:
        return generate_codes(session, phase, 1, jours)[0]
    finally:
        session.close()


def corps_d_inscription(key_id: str, code: str, contact_email: str | None = None) -> dict:
    return {
        "key_id": key_id,
        "access_code": code,
        "contact_email": contact_email or f"contact-{secrets.token_hex(6)}@example.com",
        "accept_terms": True,
    }


def inscrire(client, key_id: str | None = None, contact_email: str | None = None, phase: str = "private", plan: str | None = "pro") -> str:
    from app.db.session import SessionLocal
    from app.core.keys import stored_key_id
    from app.models.key import Key

    key_id = key_id or nouvelle_cle()
    response = client.post("/key/register", json=corps_d_inscription(key_id, code_d_acces(phase), contact_email))
    assert response.status_code == 200, response.text
    if plan is not None:
        session = SessionLocal()
        try:
            session.query(Key).filter(Key.key_id == stored_key_id(key_id)).update({Key.plan: plan, Key.status: "active"})
            session.commit()
        finally:
            session.close()
    return key_id


def lien_de_confirmation(email: dict) -> str:
    texte = email["text"]
    debut = texte.index("https://app.veilix.test/confirm")
    return texte[debut:].split()[0]


def jeton_de(lien: str) -> str:
    return lien.split("#token=", 1)[1]


def signature_mailgun(timestamp: str | None = None, token: str | None = None, cle: str = TEST_SIGNING_KEY) -> dict:
    timestamp = timestamp or str(int(time.time()))
    token = token or secrets.token_hex(25)
    signature = hmac.new(cle.encode(), f"{timestamp}{token}".encode(), hashlib.sha256).hexdigest()
    return {"timestamp": timestamp, "token": token, "signature": signature}
