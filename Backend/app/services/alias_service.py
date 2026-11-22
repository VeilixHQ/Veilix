import secrets
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.alias import Alias
from app.models.key import Key
from app.core.config import DOMAIN, INTERNAL_DOMAINS
from app.core.encryption import encrypt, hash_email
from app.plans import get_effective_plan, check_alias_allowance, destination_limit, limit_detail
from app.services.key_service import get_key_by_id
from app.services.destination_service import is_verified
from app.services import domain_service

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

def count_aliases(db: Session, key_obj: Key) -> int:
    return db.query(Alias).filter(Alias.key_id == key_obj.id).count()

def destinations_in_use(db: Session, key_obj: Key) -> set[str]:
    return {row[0] for row in db.query(Alias.email_hmac).filter(Alias.key_id == key_obj.id).distinct().all()}

def _check_destination_limit(db: Session, key_obj: Key, email_hmac: str) -> None:
    plan = get_effective_plan(key_obj.key_id, key_obj.plan, key_obj.is_admin)
    limit = destination_limit(plan)
    if limit is None:
        return
    used = destinations_in_use(db, key_obj)
    if email_hmac not in used and len(used) >= limit:
        db.rollback()
        raise HTTPException(status_code=403, detail="DESTINATION_LIMIT")

def _lock_key(db: Session, key_obj: Key) -> Key:
    return (
        db.query(Key)
        .filter(Key.id == key_obj.id)
        .with_for_update()
        .populate_existing()
        .one()
    )

def _reserve_slot(db: Session, key_obj: Key) -> None:
    plan = get_effective_plan(key_obj.key_id, key_obj.plan, key_obj.is_admin)
    allowance = check_alias_allowance(plan, count_aliases(db, key_obj), key_obj.credits)
    if not allowance.allowed:
        db.rollback()
        raise HTTPException(status_code=403, detail=limit_detail(plan))
    if allowance.uses_credit:
        key_obj.credits -= 1

def _generate_alias_email(db: Session, domain: str = DOMAIN) -> str:
    for _ in range(ALIAS_GENERATION_ATTEMPTS):
        candidate = f"{secrets.token_hex(ALIAS_LOCAL_PART_BYTES)}@{domain}"
        if not db.query(Alias).filter(Alias.alias_email == candidate).first():
            return candidate
    raise HTTPException(status_code=503, detail="Génération de l'alias impossible, réessayez.")

def _alias_address(db: Session, key_obj: Key, domain_id: int | None, local_part: str | None) -> tuple[str, int | None]:
    if domain_id is None:
        if local_part:
            raise HTTPException(status_code=400, detail="LOCAL_PART_REQUIRES_DOMAIN")
        return _generate_alias_email(db), None
    domain = domain_service.verified_domain_for(db, key_obj, domain_id)
    if not local_part:
        return _generate_alias_email(db, domain.domain), domain.id
    address = f"{domain_service.normalize_local_part(local_part)}@{domain.domain}"
    if db.query(Alias.id).filter(Alias.alias_email == address).first():
        raise HTTPException(status_code=409, detail="ALIAS_TAKEN")
    return address, domain.id

def create_alias(db: Session, key_arg, destination_email: str, label: str | None = None, domain_id: int | None = None, local_part: str | None = None) -> Alias:
    key_obj = _resolve_key(db, key_arg)
    destination = destination_email.strip()
    destination_domain = destination.rpartition("@")[2].lower()
    if destination_domain in INTERNAL_DOMAINS or domain_service.is_customer_domain(db, destination_domain):
        raise HTTPException(status_code=400, detail="Une adresse Veilix ne peut pas servir de destination.")
    address, alias_domain_id = _alias_address(db, key_obj, domain_id, local_part)
    key_obj = _lock_key(db, key_obj)
    email_hmac = hash_email(destination)
    _check_destination_limit(db, key_obj, email_hmac)
    _reserve_slot(db, key_obj)

    encrypted_dest, key_version = encrypt(destination)

    alias = Alias(
        key_id=key_obj.id,
        alias_email=address,
        domain_id=alias_domain_id,
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

def create_catch_all_alias(db: Session, domain, recipient: str) -> Alias | None:
    destination = domain_service.catch_all_destination(domain)
    if not domain.catch_all or not destination:
        return None
    key_obj = db.query(Key).filter(Key.id == domain.key_id).first()
    if not key_obj or key_obj.status != "active":
        return None
    key_obj = _lock_key(db, key_obj)
    try:
        _reserve_slot(db, key_obj)
    except HTTPException:
        return None
    encrypted_dest, key_version = encrypt(destination)
    alias = Alias(
        key_id=key_obj.id,
        alias_email=recipient,
        destination_email=encrypted_dest,
        key_version=key_version,
        email_hmac=domain.catch_all_destination_hmac,
        label="catch-all",
        domain_id=domain.id,
        status="active" if is_verified(db, key_obj.id, domain.catch_all_destination_hmac) else "pending",
    )
    db.add(alias)
    try:
        db.commit()
    except Exception:
        db.rollback()
        return db.query(Alias).filter(Alias.alias_email == recipient).first()
    db.refresh(alias)
    return alias
