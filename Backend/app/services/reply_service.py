import hashlib
import hmac
import string

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import HMAC_SECRET, REPLY_DOMAIN
from app.core.encryption import decrypt, encrypt
from app.models.alias import Alias
from app.models.reply_route import ReplyRoute

REPLY_PREFIX = "reply+"
TOKEN_LENGTH = 32
_HEX = set(string.hexdigits.lower())


def _secret() -> bytes:
    if not HMAC_SECRET:
        raise RuntimeError("HMAC_SECRET manquante dans les variables d'environnement.")
    return HMAC_SECRET.encode()


def _token(alias_id: int, sender: str) -> str:
    return hmac.new(_secret(), f"reply:{alias_id}:{sender}".encode(), hashlib.sha256).hexdigest()[:TOKEN_LENGTH]


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def route_hash(alias_id: int, sender: str) -> str:
    return _token_hash(_token(alias_id, sender))


def reply_address(db: Session, alias: Alias, sender: str) -> str:
    token = _token(alias.id, sender)
    token_hash = _token_hash(token)
    if not db.query(ReplyRoute.id).filter(ReplyRoute.token_hash == token_hash).first():
        db.add(ReplyRoute(alias_id=alias.id, token_hash=token_hash, sender_email=encrypt(sender)[0]))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
    return f"{REPLY_PREFIX}{token}@{REPLY_DOMAIN}"


def reply_token(recipient: str) -> str | None:
    local, _, domain = recipient.partition("@")
    if domain != REPLY_DOMAIN or not local.startswith(REPLY_PREFIX):
        return None
    return local[len(REPLY_PREFIX):]


def find_route(db: Session, token: str) -> tuple[Alias, str] | None:
    if len(token) != TOKEN_LENGTH or not set(token) <= _HEX:
        return None
    route = db.query(ReplyRoute).filter(ReplyRoute.token_hash == _token_hash(token)).first()
    if not route:
        return None
    alias = db.get(Alias, route.alias_id)
    if not alias:
        return None
    return alias, decrypt(route.sender_email)
