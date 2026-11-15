import hashlib
import hmac
import time

from sqlalchemy import text

from app.core.config import MAILGUN_SIGNING_KEY
from app.db.session import engine

MAX_SIGNATURE_AGE_SECONDS = 12 * 3600

_PURGE_TOKENS = text("DELETE FROM webhook_tokens WHERE claimed_at < now() - make_interval(secs => :age)")
_CLAIM_TOKEN = text(
    "INSERT INTO webhook_tokens (token_hash, claimed_at) VALUES (:token_hash, now()) "
    "ON CONFLICT (token_hash) DO NOTHING RETURNING token_hash"
)
_RELEASE_TOKEN = text("DELETE FROM webhook_tokens WHERE token_hash = :token_hash")


def verify_signature(timestamp: str, token: str, signature: str) -> bool:
    if not all((MAILGUN_SIGNING_KEY, timestamp, token, signature)):
        return False
    try:
        sent_at = int(timestamp)
    except (TypeError, ValueError):
        return False
    if abs(time.time() - sent_at) > MAX_SIGNATURE_AGE_SECONDS:
        return False
    expected = hmac.new(
        MAILGUN_SIGNING_KEY.encode("utf-8"),
        msg=f"{timestamp}{token}".encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected.encode("utf-8"), str(signature).encode("utf-8"))


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def claim_token(token: str) -> bool:
    with engine.begin() as conn:
        conn.execute(_PURGE_TOKENS, {"age": MAX_SIGNATURE_AGE_SECONDS})
        claimed = conn.execute(_CLAIM_TOKEN, {"token_hash": _token_hash(token)}).first()
    return claimed is not None


def release_token(token: str) -> None:
    with engine.begin() as conn:
        conn.execute(_RELEASE_TOKEN, {"token_hash": _token_hash(token)})
