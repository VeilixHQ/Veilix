import hashlib
import hmac
import time

from sqlalchemy import text

from app.core.config import HMAC_SECRET, MAILGUN_SIGNING_KEY
from app.db.session import engine

MAX_SIGNATURE_AGE_SECONDS = 12 * 3600
LEASE_SECONDS = 300
MESSAGE_RETENTION_SECONDS = 3 * 24 * 3600

CLAIMED = "claimed"
BUSY = "busy"
DONE = "done"

_PURGE_TOKENS = text("DELETE FROM webhook_tokens WHERE claimed_at < now() - make_interval(secs => :age)")
_CLAIM_TOKEN = text(
    """
    INSERT INTO webhook_tokens (token_hash, claimed_at) VALUES (:token_hash, now())
    ON CONFLICT (token_hash) DO UPDATE SET claimed_at = now()
        WHERE webhook_tokens.completed_at IS NULL
          AND webhook_tokens.claimed_at < now() - make_interval(secs => :lease)
    RETURNING token_hash
    """
)
_TOKEN_COMPLETED = text("SELECT completed_at IS NOT NULL FROM webhook_tokens WHERE token_hash = :token_hash")
_COMPLETE_TOKEN = text("UPDATE webhook_tokens SET completed_at = now() WHERE token_hash = :token_hash")
_RELEASE_TOKEN = text("DELETE FROM webhook_tokens WHERE token_hash = :token_hash AND completed_at IS NULL")

_PURGE_MESSAGES = text("DELETE FROM inbound_messages WHERE claimed_at < now() - make_interval(secs => :age)")
_CLAIM_MESSAGE = text(
    """
    INSERT INTO inbound_messages (message_hash, claimed_at) VALUES (:message_hash, now())
    ON CONFLICT (message_hash) DO UPDATE SET claimed_at = now()
        WHERE inbound_messages.completed_at IS NULL
          AND inbound_messages.claimed_at < now() - make_interval(secs => :lease)
    RETURNING message_hash
    """
)
_MESSAGE_COMPLETED = text("SELECT completed_at IS NOT NULL FROM inbound_messages WHERE message_hash = :message_hash")
_COMPLETE_MESSAGE = text(
    "UPDATE inbound_messages SET completed_at = now(), result = :result WHERE message_hash = :message_hash"
)
_RELEASE_MESSAGE = text("DELETE FROM inbound_messages WHERE message_hash = :message_hash AND completed_at IS NULL")


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
        claimed = conn.execute(_CLAIM_TOKEN, {"token_hash": _token_hash(token), "lease": LEASE_SECONDS}).first()
    return claimed is not None


def token_completed(token: str) -> bool:
    with engine.connect() as conn:
        return bool(conn.execute(_TOKEN_COMPLETED, {"token_hash": _token_hash(token)}).scalar())


def complete_token(token: str) -> None:
    with engine.begin() as conn:
        conn.execute(_COMPLETE_TOKEN, {"token_hash": _token_hash(token)})


def release_token(token: str) -> None:
    with engine.begin() as conn:
        conn.execute(_RELEASE_TOKEN, {"token_hash": _token_hash(token)})


def message_key(message_id: str, recipient: str, sender: str) -> str | None:
    identifier = "".join((message_id or "").split())
    if not identifier or not HMAC_SECRET:
        return None
    material = "\x00".join((identifier, recipient, sender))
    return hmac.new(HMAC_SECRET.encode(), f"inbound:{material}".encode(), hashlib.sha256).hexdigest()


def claim_message(key: str) -> str:
    with engine.begin() as conn:
        conn.execute(_PURGE_MESSAGES, {"age": MESSAGE_RETENTION_SECONDS})
        if conn.execute(_CLAIM_MESSAGE, {"message_hash": key, "lease": LEASE_SECONDS}).first():
            return CLAIMED
        completed = conn.execute(_MESSAGE_COMPLETED, {"message_hash": key}).scalar()
    return DONE if completed else BUSY


def complete_message(key: str, result: str) -> None:
    with engine.begin() as conn:
        conn.execute(_COMPLETE_MESSAGE, {"message_hash": key, "result": result[:16]})


def release_message(key: str) -> None:
    with engine.begin() as conn:
        conn.execute(_RELEASE_MESSAGE, {"message_hash": key})
