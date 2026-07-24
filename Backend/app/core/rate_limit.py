from datetime import datetime, timezone, timedelta
from fastapi import HTTPException
from collections import defaultdict
import threading

DAILY_LIMIT = 100
WINDOW = timedelta(hours=24)

_lock = threading.Lock()
_request_log: dict[str, list[datetime]] = defaultdict(list)

def _prune(key_id: str, now: datetime) -> None:
    cutoff = now - WINDOW
    _request_log[key_id] = [ts for ts in _request_log[key_id] if ts > cutoff]

def enforce_daily_limit(key_id: str) -> None:
    now = datetime.now(timezone.utc)
    with _lock:
        _prune(key_id, now)
        if len(_request_log[key_id]) >= DAILY_LIMIT:
            oldest = _request_log[key_id][0]
            retry_after = int((oldest + WINDOW - now).total_seconds())
            raise HTTPException(
                status_code=429,
                detail=f"Limite de {DAILY_LIMIT} actions/24h atteinte. Reessayez plus tard.",
                headers={"Retry-After": str(max(retry_after, 1))},
            )
        _request_log[key_id].append(now)