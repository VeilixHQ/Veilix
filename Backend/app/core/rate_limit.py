import hashlib
import hmac
import math
import secrets

from fastapi import HTTPException, Request
from sqlalchemy import text

from app.core.config import HMAC_SECRET
from app.core.limiter import client_ip
from app.db.session import engine

DAILY_LIMIT = 100
DAILY_WINDOW_SECONDS = 24 * 3600
PURGE_ONE_IN = 200
PURGE_AFTER_SECONDS = 2 * 24 * 3600

_HIT = text(
    """
    INSERT INTO rate_limits (bucket, window_start, hits)
    VALUES (:bucket, now(), 1)
    ON CONFLICT (bucket) DO UPDATE SET
        hits = CASE WHEN rate_limits.window_start <= now() - make_interval(secs => :window)
                    THEN 1 ELSE rate_limits.hits + 1 END,
        window_start = CASE WHEN rate_limits.window_start <= now() - make_interval(secs => :window)
                            THEN now() ELSE rate_limits.window_start END
    RETURNING hits, EXTRACT(EPOCH FROM (window_start + make_interval(secs => :window) - now()))
    """
)
_PURGE = text("DELETE FROM rate_limits WHERE window_start < now() - make_interval(secs => :age)")
_PEEK = text(
    "SELECT hits FROM rate_limits WHERE bucket = :bucket AND window_start > now() - make_interval(secs => :window)"
)


def _bucket(scope: str, identifier: str) -> str:
    digest = hmac.new((HMAC_SECRET or "").encode(), f"{scope}:{identifier}".encode(), hashlib.sha256).hexdigest()
    return f"{scope}:{digest[:40]}"


def _record(scope: str, identifier: str, window_seconds: int) -> tuple[int, float]:
    with engine.begin() as conn:
        hits, remaining = conn.execute(_HIT, {"bucket": _bucket(scope, identifier), "window": window_seconds}).one()
        if secrets.randbelow(PURGE_ONE_IN) == 0:
            conn.execute(_PURGE, {"age": PURGE_AFTER_SECONDS})
    return hits, float(remaining)


def allow(scope: str, identifier: str, limit: int, window_seconds: int) -> bool:
    return _record(scope, identifier, window_seconds)[0] <= limit


def blocked(scope: str, identifier: str, limit: int, window_seconds: int) -> bool:
    with engine.connect() as conn:
        hits = conn.execute(_PEEK, {"bucket": _bucket(scope, identifier), "window": window_seconds}).scalar()
    return hits is not None and hits >= limit


def hit(scope: str, identifier: str, limit: int, window_seconds: int, detail: str) -> None:
    hits, remaining = _record(scope, identifier, window_seconds)
    if hits > limit:
        raise HTTPException(
            status_code=429,
            detail=detail,
            headers={"Retry-After": str(max(math.ceil(float(remaining)), 1))},
        )


def enforce_daily_limit(key_id: str) -> None:
    hit(
        "daily",
        key_id,
        DAILY_LIMIT,
        DAILY_WINDOW_SECONDS,
        f"Limite de {DAILY_LIMIT} actions/24h atteinte. Reessayez plus tard.",
    )


def ip_limit(scope: str, limit: int, window_seconds: int):
    def dependency(request: Request) -> None:
        hit(scope, client_ip(request), limit, window_seconds, "Trop de requêtes. Réessayez plus tard.")
    return dependency
