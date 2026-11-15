from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timezone
from app.models.key import Key
from app.core.keys import stored_key_id, is_stored_form

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
    if key.status == "pending_payment":
        raise HTTPException(status_code=402, detail="PAYMENT_REQUIRED")
    if key.status != "active":
        raise HTTPException(status_code=403, detail="Clé suspendue")
    return touch_key(db, key)