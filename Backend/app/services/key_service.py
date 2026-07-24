from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timezone
from app.models.key import Key

def create_key(db: Session, key_id: str, recovery_email: str | None = None) -> Key:
    existing = db.query(Key).filter(Key.key_id == key_id).first()
    if existing:
        return existing
    key = Key(key_id=key_id, recovery_email=recovery_email, plan="starter", status="active", credits=0)
    db.add(key)
    db.commit()
    db.refresh(key)
    return key

def get_key_by_id(db: Session, key_id: str) -> Key | None:
    return db.query(Key).filter(Key.key_id == key_id).first()

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