import random, string
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.alias import Alias
from app.models.key import Key
from app.core.config import DOMAIN
from app.core.encryption import encrypt, decrypt, hash_email

PLAN_LIMITS = { "starter": 5, "pro": 100, "business": None }


def _generate_alias(domain: str = DOMAIN) -> str:
    rand = "".join(random.choices(string.ascii_lowercase + string.digits, k=10))
    return f"{rand}@{domain}"


def _check_quota(db: Session, key: Key):
    limit = PLAN_LIMITS.get(key.plan)
    if limit is None:
        return
    count = db.query(Alias).filter(Alias.key_id == key.id).count()
    if count >= limit:
        raise HTTPException(
            status_code=403,
            detail=f"Limite de {limit} alias atteinte pour le plan {key.plan}. Passez Pro ou achetez des credits."
        )


def create_alias(db: Session, key_id: int, destination_email: str, label: str = None) -> Alias:
    key = db.query(Key).filter(Key.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Cle introuvable")

    _check_quota(db, key)

    for _ in range(5):
        candidate = _generate_alias()
        if not db.query(Alias).filter(Alias.alias_email == candidate).first():
            break
    else:
        raise HTTPException(status_code=500, detail="Impossible de generer un alias unique")

    encrypted_email, version = encrypt(destination_email)

    alias = Alias(
        key_id=key.id,
        alias_email=candidate,
        destination_email=encrypted_email,
        key_version=version,
        email_hmac=hash_email(destination_email),
        label=label,
        status="active"
    )
    db.add(alias)
    db.commit()
    db.refresh(alias)

    alias.destination_email = destination_email  # renvoyé en clair au frontend
    return alias


def list_aliases(db: Session, key_id: int) -> list[Alias]:
    aliases = db.query(Alias).filter(Alias.key_id == key_id).all()
    for alias in aliases:
        alias.destination_email = decrypt(alias.destination_email, alias.key_version)
    return aliases


def disable_alias(db: Session, alias_id: int, key_id: int) -> Alias:
    alias = db.query(Alias).filter(Alias.id == alias_id, Alias.key_id == key_id).first()
    if not alias:
        raise HTTPException(status_code=404, detail="Alias introuvable")
    alias.status = "disabled"
    db.commit()
    db.refresh(alias)
    alias.destination_email = decrypt(alias.destination_email, alias.key_version)
    return alias


def enable_alias(db: Session, alias_id: int, key_id: int) -> Alias:
    alias = db.query(Alias).filter(Alias.id == alias_id, Alias.key_id == key_id).first()
    if not alias:
        raise HTTPException(status_code=404, detail="Alias introuvable")
    alias.status = "active"
    db.commit()
    db.refresh(alias)
    alias.destination_email = decrypt(alias.destination_email, alias.key_version)
    return alias


def delete_alias(db: Session, alias_id: int, key_id: int):
    alias = db.query(Alias).filter(Alias.id == alias_id, Alias.key_id == key_id).first()
    if not alias:
        raise HTTPException(status_code=404, detail="Alias introuvable")
    db.delete(alias)
    db.commit()