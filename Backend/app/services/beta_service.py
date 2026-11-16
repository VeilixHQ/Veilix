import hmac
import json
import logging
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import or_, and_, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core import config
from app.core.encryption import decrypt, encrypt, hash_email
from app.models.access_code import AccessCode
from app.models.alias import Alias
from app.models.beta import BetaFeedback, BetaSignup
from app.models.destination import DestinationVerification
from app.models.key import Key
from app.services import email_service
from app.services.access_service import create_code

logger = logging.getLogger("veilix.beta")

PHASES = ("private", "public")
FEEDBACK_PERIOD = {"private": timedelta(days=7), "public": timedelta(days=14)}
REMINDER_GRACE = timedelta(hours=48)
FINAL_FEEDBACK_NOTICE = timedelta(hours=48)
DUE_NOTICE = timedelta(hours=24)
FIRST_FEEDBACK_DELAY = timedelta(days=7)
MIN_USAGE_BEFORE_FEEDBACK = timedelta(days=3)
FEEDBACK_FORM_PATH = "/dashboard?retour=1"


def now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


PLUS_ADDRESSING_DOMAINS = (
    "gmail.com", "googlemail.com", "outlook.com", "outlook.fr", "hotmail.com", "hotmail.fr", "live.com", "live.fr",
    "proton.me", "protonmail.com", "pm.me", "icloud.com", "me.com", "fastmail.com",
)
DOTLESS_DOMAINS = ("gmail.com",)
DOMAIN_SYNONYMS = {"googlemail.com": "gmail.com", "protonmail.com": "proton.me", "pm.me": "proton.me", "me.com": "icloud.com"}


def seat_identity(address: str) -> str:
    local, _, domain = address.strip().lower().rpartition("@")
    if domain in PLUS_ADDRESSING_DOMAINS:
        local = local.split("+", 1)[0]
    domain = DOMAIN_SYNONYMS.get(domain, domain)
    if domain in DOTLESS_DOMAINS:
        local = local.replace(".", "")
    return f"{local}@{domain}"


MONTHS_FR = ("janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre")


def _last_sunday(year: int, month: int) -> datetime:
    day = datetime(year, month + 1, 1) - timedelta(days=1)
    return day - timedelta(days=(day.weekday() + 1) % 7)


def _paris(value: datetime) -> datetime:
    summer_start = _last_sunday(value.year, 3) + timedelta(hours=1)
    summer_end = _last_sunday(value.year, 10) + timedelta(hours=1)
    return value + timedelta(hours=2 if summer_start <= value < summer_end else 1)


def _day_fr(value: datetime) -> str:
    local = _paris(value)
    day = "1er" if local.day == 1 else str(local.day)
    return f"{day} {MONTHS_FR[local.month - 1]} {local.year}"


def _date_fr(value: datetime) -> str:
    local = _paris(value)
    return f"{_day_fr(value)} à {local:%H:%M}"


def _frontend(path: str) -> str:
    return f"{config.FRONTEND_URL}{path}"


def phase_ends_at(phase: str) -> datetime | None:
    return config.BETA_PRIVATE_ENDS_AT if phase == "private" else config.BETA_PUBLIC_ENDS_AT


def phase_opens_at(phase: str) -> datetime | None:
    return config.BETA_PRIVATE_OPENS_AT if phase == "private" else config.BETA_PUBLIC_OPENS_AT


def signups_close_at(phase: str) -> datetime | None:
    close = config.BETA_PRIVATE_SIGNUPS_CLOSE_AT if phase == "private" else config.BETA_PUBLIC_SIGNUPS_CLOSE_AT
    return close or phase_ends_at(phase)


def wave2_opens_at() -> datetime | None:
    if not config.BETA_PUBLIC_OPENS_AT:
        return None
    return config.BETA_PUBLIC_OPENS_AT + timedelta(days=config.BETA_PUBLIC_WAVE2_AFTER_DAYS)


def phase_running(phase: str, now: datetime) -> bool:
    ends = phase_ends_at(phase)
    return ends is None or now < ends


def capacity(phase: str, now: datetime) -> int | None:
    if not phase_running(phase, now):
        return None
    opens = phase_opens_at(phase)
    close = signups_close_at(phase)
    if close and now >= close:
        return None
    if phase == "private":
        if not config.BETA_PRIVATE_INVITE_TOKEN or (opens and now < opens):
            return None
        return config.BETA_PRIVATE_SEATS
    if not opens or now < opens:
        return None
    seats = config.BETA_PUBLIC_WAVE1_SEATS
    second = wave2_opens_at()
    if second and now >= second and not config.BETA_PUBLIC_WAVE2_HOLD:
        seats += config.BETA_PUBLIC_WAVE2_SEATS
    return seats


def seats_taken(db: Session, phase: str, now: datetime) -> int:
    return (
        db.query(AccessCode)
        .filter(
            AccessCode.phase == phase,
            AccessCode.signup_id.isnot(None),
            or_(AccessCode.status == "used", and_(AccessCode.status == "unused", AccessCode.expires_at > now)),
        )
        .count()
    )


def _lock_phase(db: Session, phase: str) -> None:
    db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:name))"), {"name": f"veilix-beta-{phase}"})


def waiting_position(db: Session, signup: BetaSignup) -> int:
    return (
        db.query(BetaSignup)
        .filter(BetaSignup.phase == signup.phase, BetaSignup.status == "waiting", BetaSignup.queued_at <= signup.queued_at)
        .count()
    )


def process_queue(db: Session, phase: str, now: datetime | None = None) -> int:
    now = now or now_utc()
    seats = capacity(phase, now)
    if seats is None:
        return 0
    invited = 0
    while True:
        _lock_phase(db, phase)
        if seats_taken(db, phase, now) >= seats:
            db.rollback()
            break
        signup = (
            db.query(BetaSignup)
            .filter(BetaSignup.phase == phase, BetaSignup.status == "waiting")
            .order_by(BetaSignup.queued_at, BetaSignup.id)
            .first()
        )
        if not signup:
            db.rollback()
            break
        code = create_code(db, phase, config.BETA_CODE_VALID_DAYS, signup_id=signup.id)
        signup.status = "invited"
        signup.invited_at = now
        expires_on = _date_fr(now + timedelta(days=config.BETA_CODE_VALID_DAYS))
        email = decrypt(signup.email, 2)
        db.commit()
        try:
            email_service.send_beta_code(email, phase, code, _frontend("/access"), expires_on)
        except Exception as exc:
            logger.error("Envoi du code bêta impossible : %s", type(exc).__name__)
            db.query(AccessCode).filter(AccessCode.signup_id == signup.id).delete(synchronize_session=False)
            signup.status = "waiting"
            signup.invited_at = None
            db.commit()
            break
        invited += 1
    return invited


def signup(db: Session, phase: str, email: str, consent: bool, invite_token: str | None = None) -> None:
    if not consent:
        raise HTTPException(status_code=400, detail="Les conditions de participation doivent être acceptées.")
    if phase == "private":
        expected = config.BETA_PRIVATE_INVITE_TOKEN
        if not expected or not hmac.compare_digest((invite_token or "").encode(), expected.encode()):
            raise HTTPException(status_code=403, detail="Lien d'invitation invalide.")
    now = now_utc()
    if capacity(phase, now) is None:
        raise HTTPException(status_code=409, detail="Les inscriptions à cette bêta ne sont pas ouvertes.")

    address = email.strip()
    digest = hash_email(seat_identity(address))
    record = db.query(BetaSignup).filter(BetaSignup.email_hmac == digest).first()
    if record and record.status != "expired":
        return
    if record:
        record.phase = phase
        record.status = "waiting"
        record.consent_at = now
        record.queued_at = now
        record.invited_at = None
    else:
        record = BetaSignup(phase=phase, email=encrypt(address)[0], email_hmac=digest, status="waiting", consent_at=now, created_at=now, queued_at=now)
        db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return

    process_queue(db, phase, now)
    db.refresh(record)
    if record.status == "waiting":
        try:
            email_service.send_beta_waitlist(address, phase, waiting_position(db, record))
        except Exception as exc:
            logger.error("Envoi de la confirmation de liste d'attente impossible : %s", type(exc).__name__)


def phase_of_key(db: Session, key: Key) -> str | None:
    access = db.query(AccessCode).filter(AccessCode.key_id == key.id).first()
    return access.phase if access else None


def final_deadline(phase: str) -> datetime | None:
    ends = phase_ends_at(phase)
    return ends - FINAL_FEEDBACK_NOTICE if ends else None


def in_final_window(phase: str, now: datetime, active_since: datetime | None = None) -> bool:
    deadline = final_deadline(phase)
    if deadline is None or now < deadline - FEEDBACK_PERIOD[phase]:
        return False
    return active_since is None or now >= deadline or now >= active_since + MIN_USAGE_BEFORE_FEEDBACK


def feedback_due_after(phase: str, start: datetime, delay: timedelta) -> datetime | None:
    due = start + delay
    deadline = final_deadline(phase)
    if deadline:
        due = min(due, max(deadline, start + MIN_USAGE_BEFORE_FEEDBACK))
    ends = phase_ends_at(phase)
    if ends and due > ends:
        return None
    return due


def first_feedback_due(phase: str, activated_at: datetime) -> datetime | None:
    return feedback_due_after(phase, activated_at, FIRST_FEEDBACK_DELAY)


def status_for(db: Session, key: Key, now: datetime | None = None) -> dict:
    now = now or now_utc()
    phase = phase_of_key(db, key)
    if not phase:
        return {"phase": None}
    return {
        "phase": phase,
        "ends_at": phase_ends_at(phase),
        "feedback_due_at": key.feedback_due_at,
        "overdue": bool(key.feedback_due_at and key.feedback_due_at < now),
        "reminded": key.feedback_reminded_at is not None,
        "final_window": in_final_window(phase, now, key.created_at),
        "final_sent": key.final_feedback_at is not None,
        "suspended_for_feedback": key.status == "suspended" and key.suspension_reason == "feedback",
        "feedback_count": db.query(BetaFeedback).filter(BetaFeedback.key_id == key.id).count(),
    }


def submit_feedback(db: Session, key: Key, answers: dict, now: datetime | None = None) -> dict:
    now = now or now_utc()
    phase = phase_of_key(db, key)
    if not phase:
        raise HTTPException(status_code=404, detail="Cette clé ne participe pas à la bêta.")
    is_final = in_final_window(phase, now, key.created_at)
    db.add(BetaFeedback(key_id=key.id, submitted_at=now, is_final=is_final, answers=encrypt(json.dumps(answers, ensure_ascii=False))[0]))
    if is_final:
        key.final_feedback_at = now
        key.feedback_due_at = None
    else:
        key.feedback_due_at = feedback_due_after(phase, now, FEEDBACK_PERIOD[phase])
    key.feedback_reminded_at = None
    key.feedback_notified_at = None
    reactivated = False
    if key.status == "suspended" and key.suspension_reason == "feedback" and phase_running(phase, now):
        key.status = "active"
        key.suspension_reason = None
        reactivated = True
    db.commit()
    if reactivated and key.contact_email:
        try:
            email_service.send_beta_reactivated(decrypt(key.contact_email, 2))
        except Exception as exc:
            logger.error("Envoi de la réactivation impossible : %s", type(exc).__name__)
    return status_for(db, key, now)


def delete_account(db: Session, key: Key) -> None:
    access = db.query(AccessCode).filter(AccessCode.key_id == key.id).first()
    phase = access.phase if access else None
    db.query(Alias).filter(Alias.key_id == key.id).delete(synchronize_session=False)
    db.query(DestinationVerification).filter(DestinationVerification.key_id == key.id).delete(synchronize_session=False)
    db.query(BetaFeedback).filter(BetaFeedback.key_id == key.id).delete(synchronize_session=False)
    if access:
        signup_id = access.signup_id
        access.status = "released"
        access.key_id = None
        access.signup_id = None
        db.flush()
        if signup_id:
            db.query(BetaSignup).filter(BetaSignup.id == signup_id).delete(synchronize_session=False)
    db.delete(key)
    db.commit()
    if phase:
        process_queue(db, phase)


def _beta_keys(db: Session):
    return db.query(Key).join(AccessCode, AccessCode.key_id == Key.id)


def _contact(key: Key) -> str | None:
    return decrypt(key.contact_email, 2) if key.contact_email else None


def expire_unused_codes(db: Session, now: datetime) -> int:
    expired = (
        db.query(AccessCode, BetaSignup)
        .join(BetaSignup, BetaSignup.id == AccessCode.signup_id)
        .filter(AccessCode.status == "unused", AccessCode.expires_at <= now, BetaSignup.status == "invited")
        .all()
    )
    for access, record in expired:
        access.status = "released"
        record.status = "expired"
        address = decrypt(record.email, 2)
        db.commit()
        try:
            email_service.send_beta_code_expired(address, _frontend("/beta"))
        except Exception as exc:
            logger.error("Envoi de l'expiration impossible : %s", type(exc).__name__)
    return len(expired)


def release_unpaid(db: Session, now: datetime) -> int:
    limit = now - timedelta(days=config.BETA_CODE_VALID_DAYS)
    stale = (
        _beta_keys(db)
        .filter(AccessCode.phase == "public", Key.status == "pending_payment", Key.terms_accepted_at <= limit)
        .all()
    )
    for key in stale:
        delete_account(db, key)
    return len(stale)


def notify_due(db: Session, now: datetime) -> int:
    upcoming = (
        _beta_keys(db)
        .filter(
            Key.status == "active",
            Key.feedback_due_at.isnot(None),
            Key.feedback_due_at > now,
            Key.feedback_due_at <= now + DUE_NOTICE,
            Key.feedback_notified_at.is_(None),
            Key.final_feedback_at.is_(None),
        )
        .all()
    )
    sent = 0
    for key in upcoming:
        address = _contact(key)
        if not address:
            continue
        phase = phase_of_key(db, key)
        final = bool(phase and in_final_window(phase, now, key.created_at))
        try:
            email_service.send_feedback_due(address, _date_fr(key.feedback_due_at), _frontend(FEEDBACK_FORM_PATH), final)
        except Exception as exc:
            logger.error("Envoi de l'échéance impossible : %s", type(exc).__name__)
            continue
        key.feedback_notified_at = now
        db.commit()
        sent += 1
    return sent


def send_reminders(db: Session, now: datetime) -> int:
    due = (
        _beta_keys(db)
        .filter(
            Key.status == "active",
            Key.feedback_due_at.isnot(None),
            Key.feedback_due_at < now,
            Key.feedback_reminded_at.is_(None),
            Key.final_feedback_at.is_(None),
        )
        .all()
    )
    sent = 0
    for key in due:
        address = _contact(key)
        if not address:
            continue
        try:
            email_service.send_feedback_reminder(address, _date_fr(key.feedback_due_at), _frontend(FEEDBACK_FORM_PATH))
        except Exception as exc:
            logger.error("Envoi du rappel impossible : %s", type(exc).__name__)
            continue
        key.feedback_reminded_at = now
        db.commit()
        sent += 1
    return sent


def suspend_overdue(db: Session, now: datetime) -> int:
    overdue = (
        _beta_keys(db)
        .filter(
            Key.status == "active",
            Key.feedback_reminded_at.isnot(None),
            Key.feedback_reminded_at <= now - REMINDER_GRACE,
            Key.feedback_due_at < now,
        )
        .all()
    )
    for key in overdue:
        key.status = "suspended"
        key.suspension_reason = "feedback"
        db.commit()
        address = _contact(key)
        if address:
            try:
                email_service.send_beta_suspended(address, _frontend(FEEDBACK_FORM_PATH))
            except Exception as exc:
                logger.error("Envoi de la suspension impossible : %s", type(exc).__name__)
    return len(overdue)


def notify_closing(db: Session, now: datetime) -> int:
    notified = 0
    for phase in PHASES:
        if phase_running(phase, now):
            continue
        keys = (
            _beta_keys(db)
            .filter(AccessCode.phase == phase, Key.beta_closed_notified_at.is_(None), Key.status != "pending_payment")
            .all()
        )
        for key in keys:
            key.beta_closed_notified_at = now
            db.commit()
            address = _contact(key)
            if address:
                try:
                    email_service.send_beta_closing(address, phase, _day_fr(config.LAUNCH_AT) if config.LAUNCH_AT else None)
                except Exception as exc:
                    logger.error("Envoi de la clôture impossible : %s", type(exc).__name__)
            notified += 1
    return notified


def tick(db: Session, now: datetime | None = None) -> dict:
    now = now or now_utc()
    report = {
        "expired": expire_unused_codes(db, now),
        "released_unpaid": release_unpaid(db, now),
        "due_notices": notify_due(db, now),
        "reminders": send_reminders(db, now),
        "suspended": suspend_overdue(db, now),
        "closing": notify_closing(db, now),
    }
    report["invited"] = sum(process_queue(db, phase, now) for phase in PHASES)
    return report
