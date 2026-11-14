import hashlib
import hmac
import threading
import time
from collections import OrderedDict

from app.core.config import MAILGUN_SIGNING_KEY

MAX_SIGNATURE_AGE_SECONDS = 12 * 3600
MAX_TRACKED_TOKENS = 50000

_lock = threading.Lock()
_claimed_tokens: OrderedDict[str, float] = OrderedDict()


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


def claim_token(token: str) -> bool:
    now = time.time()
    with _lock:
        while _claimed_tokens:
            oldest_token, claimed_at = next(iter(_claimed_tokens.items()))
            if len(_claimed_tokens) > MAX_TRACKED_TOKENS or claimed_at < now - MAX_SIGNATURE_AGE_SECONDS:
                _claimed_tokens.pop(oldest_token, None)
            else:
                break
        if token in _claimed_tokens:
            return False
        _claimed_tokens[token] = now
        return True


def release_token(token: str) -> None:
    with _lock:
        _claimed_tokens.pop(token, None)
