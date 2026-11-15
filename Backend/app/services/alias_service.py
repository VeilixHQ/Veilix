import secrets
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.alias import Alias
from app.models.key import Key
from app.core.config import DOMAIN, INTERNAL_DOMAINS
from app.core.encryption import encrypt, hash_email
from app.plans import get_effective_plan, can_create_alias
from app.services.key_service import get_key_by_id
from app.services.destination_service import is_verified

ALIAS_LOCAL_PART_BYTES = 6
ALIAS_GENERATION_ATTEMPTS = 5

def _resolve_key(db: Session, key_arg) -> Key:
    if isinstance(key_arg, Key):
        return key_arg
    if isinstance(key_arg, int):
        key_obj = db.query(Key).filter(Key.id == key_arg).first()
    elif isinstance(key_arg, str):
        key_obj = get_key_by_id(db, key_arg)
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

def _generate_alias_email(db: Session) -> str:
    for _ in range(ALIAS_GENERATION_ATTEMPTS):
        candidate = f"{secrets.token_hex(ALIAS_LOCAL_PART_BYTES)}@{DOMAIN}"
        if not db.query(Alias).filter(Alias.alias_email == candidate).first():
            return candidate
    raise HTTPException(status_code=503, detail="Génération de l'alias impossible, réessayez.")

def create_alias(db: Session, key_arg, destination_email: str, label: str | None = None) -> Alias:
    key_obj = _resolve_key(db, key_arg)
    destination = destination_email.strip()
    if destination.rpartition("@")[2].lower() in INTERNAL_DOMAINS:
        raise HTTPException(status_code=400, detail="Une adresse Veilix ne peut pas servir de destination.")
    _check_quota(db, key_obj)

    encrypted_dest, key_version = encrypt(destination)
    email_hmac = hash_email(destination)

    alias = Alias(
        key_id=key_obj.id,
        alias_email=_generate_alias_email(db),
        destination_email=encrypted_dest,
        key_version=key_version,
        email_hmac=email_hmac,
        label=label,
        status="active" if is_verified(db, key_obj.id, email_hmac) else "pending"
    )
    db.add(alias)
    db.commit()
    db.refresh(alias)
    return alias

def get_alias(db: Session, key_arg, alias_id: int) -> Alias:
    key_obj = _resolve_key(db, key_arg)
    alias = db.query(Alias).filter(Alias.id == alias_id, Alias.key_id == key_obj.id).first()
    if not alias:
        raise HTTPException(status_code=404, detail="Alias introuvable")
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
    alias.status = "active" if is_verified(db, key_obj.id, alias.email_hmac) else "pending"
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