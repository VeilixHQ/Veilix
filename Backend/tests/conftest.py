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
    from app.core import mailgun, rate_limit
    from app.core.limiter import limiter
    from app.db.session import engine

    with engine.begin() as conn:
        conn.execute(text("TRUNCATE destination_verifications, aliases, keys RESTART IDENTITY CASCADE"))
    limiter.reset()
    rate_limit._request_log.clear()
    mailgun._claimed_tokens.clear()
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


def inscrire(client, key_id: str | None = None, recovery_email: str | None = None) -> str:
    key_id = key_id or nouvelle_cle()
    body = {"key_id": key_id}
    if recovery_email:
        body["recovery_email"] = recovery_email
    response = client.post("/key/register", json=body)
    assert response.status_code == 200, response.text
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
