import hashlib
import hmac
import logging
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core import config
from app.core.encryption import decrypt, encrypt, hash_email
from app.models.launch import LaunchSignup
from app.services import email_service
from app.services.beta_service import _day_fr, now_utc, seat_identity

logger = logging.getLogger("veilix.launch")

BATCH_SIZE = 300


def is_open(now: datetime) -> bool:
    return config.LAUNCH_AT is None or now < config.LAUNCH_AT


def launch_day() -> str | None:
    return _day_fr(config.LAUNCH_AT) if config.LAUNCH_AT else None


def leave_token(record: LaunchSignup) -> str:
    digest = hmac.new((config.HMAC_SECRET or "").encode(), f"launch-leave:{record.id}:{record.email_hmac}".encode(), hashlib.sha256).hexdigest()
    return f"{record.id}.{digest[:32]}"


def leave_url(record: LaunchSignup) -> str:
    return f"{config.FRONTEND_URL}/beta?retrait={leave_token(record)}"


def count(db: Session) -> int:
    return db.query(LaunchSignup).count()


def signup(db: Session, email: str, consent: bool) -> None:
    if not consent:
        raise HTTPException(status_code=400, detail="Votre accord est nécessaire pour être prévenu du lancement.")
    now = now_utc()
    if not is_open(now):
        raise HTTPException(status_code=409, detail="Veilix est ouvert : la liste d'attente est close.")
    address = email.strip()
    digest = hash_email(seat_identity(address))
    if db.query(LaunchSignup).filter(LaunchSignup.email_hmac == digest).first():
        return
    record = LaunchSignup(email=encrypt(address)[0], email_hmac=digest, consent_at=now, created_at=now)
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return
    db.refresh(record)
    try:
        email_service.send_launch_waitlist(address, launch_day(), leave_url(record))
    except Exception as exc:
        logger.error("Envoi de la confirmation de liste d'attente impossible : %s", type(exc).__name__)


def leave(db: Session, token: str) -> bool:
    ident, _, _ = (token or "").partition(".")
    if not ident.isdigit():
        return False
    record = db.get(LaunchSignup, int(ident))
    if not record or not hmac.compare_digest(leave_token(record), token):
        return False
    db.delete(record)
    db.commit()
    return True


def notify_launch(db: Session, now: datetime) -> int:
    if not config.LAUNCH_NOTIFY_ENABLED or not config.LAUNCH_AT or now < config.LAUNCH_AT:
        return 0
    sent = 0
    for record in db.query(LaunchSignup).order_by(LaunchSignup.id).limit(BATCH_SIZE).all():
        address = decrypt(record.email, 2)
        try:
            email_service.send_launch_open(address, f"{config.FRONTEND_URL}/pricing")
        except Exception as exc:
            logger.error("Envoi de l'e-mail d'ouverture impossible : %s", type(exc).__name__)
            continue
        db.delete(record)
        db.commit()
        sent += 1
    return sent
