import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core import config, rate_limit
from app.core.encryption import hash_email
from app.models.alias import Alias
from app.models.delivery import DestinationHealth
from app.models.destination import DestinationVerification
from app.models.key import Key
from app.models.reply_route import ReplyRoute
from app.services import email_service, reply_service
from app.services.inbound_service import destination_of, normalize_address

logger = logging.getLogger("veilix.delivery")

HARD_BOUNCE_REASONS = ("bounce", "suppress-bounce")
SOFT_FAILURE_THRESHOLD = 5
SOFT_FAILURE_WINDOW = timedelta(hours=72)
COMPLAINT_THRESHOLD = 3
COMPLAINT_WINDOW = timedelta(days=30)
REPLY_COMPLAINT_THRESHOLD = 5
NOTICES_PER_DAY = 5
DAY_SECONDS = 24 * 3600

_ENSURE_HEALTH = text("INSERT INTO destination_health (email_hmac) VALUES (:email_hmac) ON CONFLICT (email_hmac) DO NOTHING")


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _health(db: Session, email_hmac: str) -> DestinationHealth:
    db.execute(_ENSURE_HEALTH, {"email_hmac": email_hmac})
    return db.query(DestinationHealth).filter(DestinationHealth.email_hmac == email_hmac).with_for_update().one()


def suspend_destination(db: Session, email_hmac: str, reason: str) -> int:
    health = _health(db, email_hmac)
    health.state = "suspended"
    health.reason = reason
    db.query(DestinationVerification).filter(DestinationVerification.email_hmac == email_hmac).update(
        {DestinationVerification.verified_at: None, DestinationVerification.token_hash: None, DestinationVerification.token_expires_at: None},
        synchronize_session=False,
    )
    paused = (
        db.query(Alias)
        .filter(Alias.email_hmac == email_hmac, Alias.status == "active")
        .update({Alias.status: "pending"}, synchronize_session=False)
    )
    logger.warning("Destination suspendue (%s) : %d alias mis en attente.", reason, paused)
    return paused


def _delivered(db: Session, email_hmac: str, now: datetime) -> str:
    health = db.query(DestinationHealth).filter(DestinationHealth.email_hmac == email_hmac).with_for_update().first()
    if health and health.state == "degraded":
        health.state = "healthy"
        health.reason = None
        health.soft_failures = 0
        health.first_soft_failure_at = None
        health.last_event_at = now
    return "delivered"


def _soft_failure(db: Session, email_hmac: str, now: datetime) -> str:
    health = _health(db, email_hmac)
    health.last_event_at = now
    if health.state == "suspended":
        return "suspended"
    if health.first_soft_failure_at is None:
        health.first_soft_failure_at = now
        health.soft_failures = 0
    health.soft_failures += 1
    health.state = "degraded"
    if health.soft_failures >= SOFT_FAILURE_THRESHOLD and now - health.first_soft_failure_at >= SOFT_FAILURE_WINDOW:
        suspend_destination(db, email_hmac, "soft_bounces")
        return "suspended"
    return "degraded"


def _hard_bounce(db: Session, email_hmac: str, now: datetime) -> str:
    health = _health(db, email_hmac)
    health.last_event_at = now
    suspend_destination(db, email_hmac, "hard_bounce")
    return "suspended"


def _complaint(db: Session, email_hmac: str, recipient: str, alias: Alias | None, now: datetime) -> str:
    health = _health(db, email_hmac)
    health.last_event_at = now
    if health.first_complaint_at is None or now - health.first_complaint_at > COMPLAINT_WINDOW:
        health.first_complaint_at = now
        health.complaints = 0
    health.complaints += 1
    repeated = health.complaints >= COMPLAINT_THRESHOLD
    if alias and alias.status == "active":
        alias.status = "disabled"
    if repeated:
        suspend_destination(db, email_hmac, "complaint")
    alias_email = alias.alias_email if alias else None
    db.commit()
    email_service.clear_suppression(recipient, ("complaints",))
    if alias_email and not repeated and rate_limit.allow("complaint-notice", email_hmac, 1, DAY_SECONDS):
        try:
            email_service.send_alias_disabled_after_complaint(recipient, alias_email, f"{config.FRONTEND_URL}/dashboard")
        except Exception as exc:
            logger.error("Envoi de l'avis de signalement impossible : %s", type(exc).__name__)
    return "suspended" if repeated else "alias_disabled"


def _destination_event(db: Session, name: str, severity: str, reason: str, recipient: str, alias: Alias | None) -> str:
    now = _now()
    email_hmac = hash_email(recipient)
    if name == "delivered":
        return _delivered(db, email_hmac, now)
    if name == "complained" or reason == "suppress-complaint":
        return _complaint(db, email_hmac, recipient, alias, now)
    if name == "unsubscribed" or reason == "suppress-unsubscribe":
        email_service.clear_suppression(recipient, ("unsubscribes",))
        return "resubscribed"
    if name != "failed":
        return "ignored"
    if severity == "permanent" and reason in HARD_BOUNCE_REASONS:
        return _hard_bounce(db, email_hmac, now)
    return _soft_failure(db, email_hmac, now)


def _reply_complaint(db: Session, alias: Alias, recipient: str) -> str:
    now = _now()
    token_hash = reply_service.route_hash(alias.id, recipient)
    db.query(ReplyRoute).filter(ReplyRoute.alias_id == alias.id, ReplyRoute.token_hash == token_hash).delete(synchronize_session=False)
    key = db.query(Key).filter(Key.id == alias.key_id).with_for_update().first()
    if not key:
        return "ignored"
    if key.reply_complaints_since is None or now - key.reply_complaints_since > COMPLAINT_WINDOW:
        key.reply_complaints_since = now
        key.reply_complaints = 0
    key.reply_complaints += 1
    if key.reply_complaints >= REPLY_COMPLAINT_THRESHOLD and key.status == "active" and not key.is_admin:
        key.status = "suspended"
        key.suspension_reason = "abuse"
        logger.warning("Clé suspendue : réponses signalées comme indésirables à répétition.")
        return "key_suspended"
    return "route_removed"


def _reply_failure(db: Session, alias: Alias, recipient: str, severity: str) -> str:
    if severity != "permanent":
        return "ignored"
    owner = destination_of(alias)
    verified = (
        db.query(DestinationVerification)
        .filter(DestinationVerification.key_id == alias.key_id, DestinationVerification.email_hmac == alias.email_hmac, DestinationVerification.verified_at.isnot(None))
        .first()
    )
    if not owner or not verified:
        return "ignored"
    if not rate_limit.allow("reply-failure-notice", str(alias.key_id), NOTICES_PER_DAY, DAY_SECONDS):
        return "ignored"
    try:
        email_service.send_reply_undelivered(owner, alias.alias_email, recipient)
    except Exception as exc:
        logger.error("Envoi de l'avis de non-remise impossible : %s", type(exc).__name__)
        return "ignored"
    return "owner_notified"


def handle_event(db: Session, event: dict) -> dict:
    name = str(event.get("event") or "").lower()
    severity = str(event.get("severity") or "").lower()
    reason = str(event.get("reason") or "").lower()
    recipient = normalize_address(str(event.get("recipient") or ""))
    message = event.get("message") if isinstance(event.get("message"), dict) else {}
    headers = message.get("headers") if isinstance(message.get("headers"), dict) else {}
    origin = normalize_address(str(headers.get("from") or ""))
    if not recipient or not name:
        return {"status": "ignored"}

    alias = db.query(Alias).filter(Alias.alias_email == origin).first() if origin else None
    to_owner = alias is None or hash_email(recipient) == alias.email_hmac
    if to_owner:
        outcome = _destination_event(db, name, severity, reason, recipient, alias)
    elif name == "complained" or reason == "suppress-complaint":
        outcome = _reply_complaint(db, alias, recipient)
    elif name == "failed":
        outcome = _reply_failure(db, alias, recipient, severity)
    else:
        outcome = "ignored"
    db.commit()
    return {"status": outcome}
