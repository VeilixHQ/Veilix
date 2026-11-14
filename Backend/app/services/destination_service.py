import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import FRONTEND_URL
from app.models.alias import Alias
from app.models.destination import DestinationVerification
from app.services import email_service

logger = logging.getLogger("veilix.destination")

TOKEN_TTL = timedelta(hours=48)
SEND_WINDOW = timedelta(hours=24)
RESEND_COOLDOWN = timedelta(minutes=2)
MAX_SENDS_PER_KEY_AND_DESTINATION = 3
MAX_SENDS_PER_DESTINATION = 6
MAX_PENDING_DESTINATIONS_PER_KEY = 5

def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def _find(db: Session, key_id: int, email_hmac: str) -> DestinationVerification | None:
    return (
        db.query(DestinationVerification)
        .filter(DestinationVerification.key_id == key_id, DestinationVerification.email_hmac == email_hmac)
        .first()
    )

def is_verified(db: Session, key_id: int, email_hmac: str) -> bool:
    record = _find(db, key_id, email_hmac)
    return bool(record and record.verified_at)

def mark_verified(db: Session, key_id: int, email_hmac: str) -> int:
    now = _now()
    record = _find(db, key_id, email_hmac)
    if not record:
        record = DestinationVerification(key_id=key_id, email_hmac=email_hmac, sent_in_window=0, created_at=now)
        db.add(record)
    record.verified_at = now
    record.token_hash = None
    record.token_expires_at = None
    activated = (
        db.query(Alias)
        .filter(Alias.key_id == key_id, Alias.email_hmac == email_hmac, Alias.status == "pending")
        .update({Alias.status: "active"}, synchronize_session=False)
    )
    db.commit()
    return activated

def request_confirmation(db: Session, key_id: int, destination_email: str, email_hmac: str) -> None:
    now = _now()
    window_start = now - SEND_WINDOW
    record = _find(db, key_id, email_hmac)
    if record and record.verified_at:
        return

    if not record:
        pending = (
            db.query(DestinationVerification)
            .filter(
                DestinationVerification.key_id == key_id,
                DestinationVerification.verified_at.is_(None),
                DestinationVerification.created_at > window_start,
            )
            .count()
        )
        if pending >= MAX_PENDING_DESTINATIONS_PER_KEY:
            raise HTTPException(status_code=429, detail="Trop d'adresses en attente de confirmation. Réessayez plus tard.")
        record = DestinationVerification(key_id=key_id, email_hmac=email_hmac, sent_in_window=0, created_at=now)
        db.add(record)

    if record.last_sent_at and record.last_sent_at > now - RESEND_COOLDOWN:
        raise HTTPException(status_code=429, detail="Un e-mail de confirmation vient d'être envoyé. Patientez quelques minutes.")

    if record.window_started_at is None or record.window_started_at <= window_start:
        record.window_started_at = now
        record.sent_in_window = 0

    if record.sent_in_window >= MAX_SENDS_PER_KEY_AND_DESTINATION:
        raise HTTPException(status_code=429, detail="Trop d'e-mails de confirmation envoyés à cette adresse. Réessayez demain.")

    sent_to_destination = (
        db.query(func.coalesce(func.sum(DestinationVerification.sent_in_window), 0))
        .filter(
            DestinationVerification.email_hmac == email_hmac,
            DestinationVerification.window_started_at > window_start,
        )
        .scalar()
    )
    if sent_to_destination >= MAX_SENDS_PER_DESTINATION:
        raise HTTPException(status_code=429, detail="Trop d'e-mails de confirmation envoyés à cette adresse. Réessayez demain.")

    token = secrets.token_urlsafe(32)
    try:
        email_service.send_destination_confirmation(destination_email, f"{FRONTEND_URL}/confirm#token={token}")
    except Exception as exc:
        db.rollback()
        logger.error("Echec de l'envoi de confirmation : %s", type(exc).__name__)
        raise HTTPException(status_code=502, detail="Envoi de l'e-mail de confirmation impossible. Réessayez plus tard.")

    record.token_hash = _hash_token(token)
    record.token_expires_at = now + TOKEN_TTL
    record.last_sent_at = now
    record.sent_in_window += 1
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=429, detail="Un e-mail de confirmation vient d'être envoyé. Patientez quelques minutes.")

def confirm_destination(db: Session, token: str) -> int:
    record = (
        db.query(DestinationVerification)
        .filter(DestinationVerification.token_hash == _hash_token(token))
        .first()
    )
    if not record or not record.token_expires_at or record.token_expires_at < _now():
        raise HTTPException(status_code=400, detail="Lien de confirmation invalide, expiré ou déjà utilisé.")
    return mark_verified(db, record.key_id, record.email_hmac)
