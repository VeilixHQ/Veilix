from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from app.models.alias import Alias
from app.models.key import Key
from app.core.config import DOMAIN
from app.core.encryption import encrypt
from app.plans import get_effective_plan, can_create_alias

def _resolve_key(db: Session, key_arg) -> Key:
    """Résout key_arg qu'il s'agisse d'un objet Key, d'un ID entier ou d'une clé textuelle (str)."""
    if isinstance(key_arg, Key):
        return key_arg
    if isinstance(key_arg, int):
        key_obj = db.query(Key).filter(Key.id == key_arg).first()
    elif isinstance(key_arg, str):
        key_obj = db.query(Key).filter(Key.key_id == key_arg).first()
    else:
        key_obj = None

    if not key_obj:
        raise HTTPException(status_code=401, detail="Clé inconnue")
    return key_obj

def _check_quota(db: Session, key_arg):
    key_obj = _resolve_key(db, key_arg)
    current_count = db.query(Alias).filter(Alias.key_id == key_obj.id).count()
    
    effective_plan = get_effective_plan(key_obj.key_id, key_obj.plan)
    if getattr(key_obj, "is_admin", False):
        effective_plan = "admin"

    if not can_create_alias(effective_plan, current_count):
        raise HTTPException(
            status_code=403,
            detail="LIMIT_REACHED_PRO"
        )

def create_alias(db: Session, key_arg, destination_email: str, label: str | None = None) -> Alias:
    key_obj = _resolve_key(db, key_arg)
    _check_quota(db, key_obj)
    
    random_local = f"alias_{key_obj.id}_{int(datetime.utcnow().timestamp())}"
    encrypted_dest = encrypt(destination_email)
    
    alias = Alias(
        key_id=key_obj.id,
        email=f"{random_local}@{DOMAIN}",
        destination_email=encrypted_dest,
        label=label,
        status="active"
    )
    db.add(alias)
    db.commit()
    db.refresh(alias)
    return alias

def list_aliases(db: Session, key_arg):
    key_obj = _resolve_key(db, key_arg)
    return db.query(Alias).filter(Alias.key_id == key_obj.id).all()

def disable_alias(db: Session, key_arg, alias_id: int):
    key_obj = _resolve_key(db, key_arg)
    alias = db.query(Alias).filter(Alias.id == alias_id, Alias.key_id == key_obj.id).first()
    if not alias:
        raise HTTPException(status_code=404, detail="Alias introuvable")
    alias.status = "disabled"
    db.commit()
    return alias

def enable_alias(db: Session, key_arg, alias_id: int):
    key_obj = _resolve_key(db, key_arg)
    alias = db.query(Alias).filter(Alias.id == alias_id, Alias.key_id == key_obj.id).first()
    if not alias:
        raise HTTPException(status_code=404, detail="Alias introuvable")
    alias.status = "active"
    db.commit()
    return alias

def delete_alias(db: Session, key_arg, alias_id: int):
    key_obj = _resolve_key(db, key_arg)
    alias = db.query(Alias).filter(Alias.id == alias_id, Alias.key_id == key_obj.id).first()
    if not alias:
        raise HTTPException(status_code=404, detail="Alias introuvable")
    db.delete(alias)
    db.commit()
    return {"ok": True}