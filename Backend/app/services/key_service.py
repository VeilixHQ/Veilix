from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from datetime import datetime, timezone
from app.models.key import Key
from app.core.encryption import encrypt
from app.core.keys import stored_key_id, is_stored_form

def create_key(db: Session, key_id: str, recovery_email: str | None = None) -> Key:
    existing = get_key_by_id(db, key_id)
    if existing:
        return existing
    stored_recovery_email = encrypt(recovery_email)[0] if recovery_email else None
    key = Key(
        key_id=stored_key_id(key_id),
        recovery_email=stored_recovery_email,
        plan="pro",
        status="active",
        credits=0,
        is_admin=False
    )
    db.add(key)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = get_key_by_id(db, key_id)
        if existing:
            return existing
        raise
    db.refresh(key)
    return key

def get_key_by_id(db: Session, key_id: str) -> Key | None:
    if not key_id or is_stored_form(key_id):
        return None
    key = db.query(Key).filter(Key.key_id == stored_key_id(key_id)).first()
    if key:
        return key
    legacy = db.query(Key).filter(Key.key_id == key_id).first()
    if not legacy:
        return None
    legacy.key_id = stored_key_id(key_id)
    db.commit()
    db.refresh(legacy)
    return legacy

def touch_key(db: Session, key: Key) -> Key:
    key.last_seen_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(key)
    return key

def require_active_key(db: Session, key_id: str) -> Key:
    key = get_key_by_id(db, key_id)
    if not key:
        raise HTTPException(status_code=401, detail="Clé inconnue")
    if key.status != "active":
        raise HTTPException(status_code=403, detail="Clé suspendue")
    return touch_key(db, key)