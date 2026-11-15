import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import HMAC_SECRET
from app.core.encryption import decrypt, encrypt, hash_email
from app.core.keys import stored_key_id
from app.models.access_code import AccessCode
from app.models.beta import BetaSignup
from app.models.key import Key
from app.services.key_service import get_key_by_id

CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
CODE_GROUPS = 2
CODE_GROUP_LENGTH = 5
CODE_PREFIXES = {"private": "VEILIX-PRIV", "public": "VEILIX-PUB"}
PHASE_ACCESS = {"private": ("pack", "active"), "public": ("pro", "pending_payment")}
PHASE_BADGES = {"private": "pionnier", "public": "eclaireur"}
BETA_TERMS_VERSION = "beta-2026-11-15"
MAX_CODE_LENGTH = 40
FIRST_FEEDBACK_DELAY = timedelta(days=7)

INVALID_CODE = "Code d'accès invalide, expiré ou déjà utilisé."


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def normalize_code(code: str) -> str:
    return "".join(c for c in (code or "").upper() if c.isascii() and c.isalnum())[:MAX_CODE_LENGTH]


def code_hash(code: str) -> str:
    return hmac.new((HMAC_SECRET or "").encode(), normalize_code(code).encode(), hashlib.sha256).hexdigest()


def _random_code(phase: str) -> str:
    groups = ["".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_GROUP_LENGTH)) for _ in range(CODE_GROUPS)]
    return "-".join([CODE_PREFIXES[phase], *groups])


def create_code(db: Session, phase: str, valid_days: int, signup_id: int | None = None) -> str:
    if phase not in CODE_PREFIXES:
        raise ValueError("Phase inconnue")
    now = _now()
    while True:
        code = _random_code(phase)
        digest = code_hash(code)
        if not db.query(AccessCode).filter(AccessCode.code_hash == digest).first():
            break
    db.add(AccessCode(code_hash=digest, phase=phase, status="unused", created_at=now, expires_at=now + timedelta(days=valid_days), signup_id=signup_id))
    db.flush()
    return code


def generate_codes(db: Session, phase: str, count: int, valid_days: int) -> list[str]:
    codes = [create_code(db, phase, valid_days) for _ in range(count)]
    db.commit()
    return codes


def _usable(access: AccessCode | None) -> bool:
    return access is not None and access.status == "unused" and access.expires_at > _now()


def check_code(db: Session, code: str) -> AccessCode | None:
    access = db.query(AccessCode).filter(AccessCode.code_hash == code_hash(code)).first()
    return access if _usable(access) else None


def _first_feedback_due(phase: str, now: datetime) -> datetime:
    from app.services.beta_service import final_deadline

    due = now + FIRST_FEEDBACK_DELAY
    deadline = final_deadline(phase)
    return min(due, deadline) if deadline else due


def register_with_code(db: Session, key_id: str, code: str, contact_email: str | None, accept_terms: bool) -> Key:
    if not accept_terms:
        raise HTTPException(status_code=400, detail="Les conditions de participation doivent être acceptées.")
    if get_key_by_id(db, key_id):
        raise HTTPException(status_code=409, detail="Cette clé est déjà enregistrée.")

    access = (
        db.query(AccessCode)
        .filter(AccessCode.code_hash == code_hash(code))
        .with_for_update()
        .first()
    )
    if not _usable(access):
        db.rollback()
        raise HTTPException(status_code=403, detail=INVALID_CODE)

    signup = db.query(BetaSignup).filter(BetaSignup.id == access.signup_id).first() if access.signup_id else None
    if signup:
        contact = decrypt(signup.email, 2)
    elif contact_email and contact_email.strip():
        contact = contact_email.strip()
    else:
        db.rollback()
        raise HTTPException(status_code=400, detail="L'adresse de contact est obligatoire.")
    contact_hmac = hash_email(contact)
    if db.query(Key).filter(Key.contact_email_hmac == contact_hmac).first():
        db.rollback()
        raise HTTPException(status_code=409, detail="Cette adresse de contact est déjà utilisée par une autre clé.")

    plan, status = PHASE_ACCESS[access.phase]
    now = _now()
    key = Key(
        key_id=stored_key_id(key_id),
        contact_email=encrypt(contact)[0],
        contact_email_hmac=contact_hmac,
        terms_version=BETA_TERMS_VERSION,
        terms_accepted_at=now,
        plan=plan,
        status=status,
        credits=0,
        is_admin=False,
        feedback_due_at=_first_feedback_due(access.phase, now),
    )
    db.add(key)
    try:
        db.flush()
        access.status = "used"
        access.used_at = now
        access.key_id = key.id
        if signup:
            signup.status = "registered"
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Inscription impossible : clé, code ou adresse déjà utilisés.")
    db.refresh(key)
    return key


def revoke_code(db: Session, code: str | None = None, code_id: int | None = None) -> AccessCode | None:
    query = db.query(AccessCode)
    access = query.filter(AccessCode.id == code_id).first() if code_id is not None else query.filter(AccessCode.code_hash == code_hash(code or "")).first()
    if not access:
        return None
    access.status = "revoked"
    if access.key_id is not None:
        key = db.query(Key).filter(Key.id == access.key_id).first()
        if key:
            key.status = "suspended"
            key.suspension_reason = "fraud"
    db.commit()
    return access


def badges_for(db: Session, key: Key) -> list[dict]:
    badges = []
    access = db.query(AccessCode).filter(AccessCode.key_id == key.id, AccessCode.status == "used").first()
    if access:
        badges.append({"id": PHASE_BADGES[access.phase], "number": None})
    if key.founder_number:
        badges.append({"id": "fondateur", "number": key.founder_number})
    return badges
