import hashlib
import secrets

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.api_token import ApiToken
from app.models.key import Key
from app.plans import get_effective_plan, has_pack_features

TOKEN_PREFIX = "vlx_"
MAX_TOKENS_PER_KEY = 10


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _require_pack(key: Key) -> None:
    if not has_pack_features(get_effective_plan(key.key_id, key.plan, key.is_admin)):
        raise HTTPException(status_code=403, detail="PACK_REQUIRED")


def list_tokens(db: Session, key: Key) -> list[ApiToken]:
    return db.query(ApiToken).filter(ApiToken.key_id == key.id).order_by(ApiToken.created_at.desc()).all()


def create_token(db: Session, key: Key, name: str) -> tuple[ApiToken, str]:
    _require_pack(key)
    if db.query(ApiToken).filter(ApiToken.key_id == key.id).count() >= MAX_TOKENS_PER_KEY:
        raise HTTPException(status_code=403, detail="TOKEN_LIMIT")
    token = TOKEN_PREFIX + secrets.token_urlsafe(32)
    record = ApiToken(key_id=key.id, name=name.strip()[:64] or "API", token_hash=_hash(token), prefix=token[:12])
    db.add(record)
    db.commit()
    db.refresh(record)
    return record, token


def revoke_token(db: Session, key: Key, token_id: int) -> None:
    record = db.query(ApiToken).filter(ApiToken.id == token_id, ApiToken.key_id == key.id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Clé d'API introuvable")
    db.delete(record)
    db.commit()


def key_for_token(db: Session, token: str) -> Key:
    if not token.startswith(TOKEN_PREFIX) or len(token) > 128:
        raise HTTPException(status_code=401, detail="Unauthorized")
    record = db.query(ApiToken).filter(ApiToken.token_hash == _hash(token)).first()
    if not record:
        raise HTTPException(status_code=401, detail="Unauthorized")
    key = db.get(Key, record.key_id)
    if not key:
        raise HTTPException(status_code=401, detail="Unauthorized")
    if key.status == "pending_payment":
        raise HTTPException(status_code=402, detail="PAYMENT_REQUIRED")
    if key.status != "active":
        raise HTTPException(status_code=403, detail="Clé suspendue")
    _require_pack(key)
    return key


def rate_identity(token: str) -> str:
    return "token:" + _hash(token)[:32]
