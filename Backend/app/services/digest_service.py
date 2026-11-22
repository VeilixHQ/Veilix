import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.alias import Alias
from app.models.key import Key
from app.services import email_service
from app.services.destination_service import is_verified
from app.services.inbound_service import destination_of

logger = logging.getLogger("veilix.digest")

PERIOD = timedelta(days=7)
TOP_ALIASES = 3


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def totals(db: Session, key: Key) -> tuple[int, int]:
    forwarded, blocked = db.query(
        func.coalesce(func.sum(Alias.forwarded_count), 0),
        func.coalesce(func.sum(Alias.blocked_count), 0),
    ).filter(Alias.key_id == key.id).one()
    return int(forwarded), int(blocked)


def reset_baseline(db: Session, key: Key, now: datetime | None = None) -> None:
    forwarded, blocked = totals(db, key)
    key.digest_forwarded_base = forwarded
    key.digest_blocked_base = blocked
    key.digest_sent_at = now or _utc_now()


def _recipient(db: Session, key: Key) -> str | None:
    rows = (
        db.query(Alias.email_hmac, func.count(Alias.id).label("uses"))
        .filter(Alias.key_id == key.id)
        .group_by(Alias.email_hmac)
        .order_by(func.count(Alias.id).desc())
        .all()
    )
    for email_hmac, _ in rows:
        if is_verified(db, key.id, email_hmac):
            alias = db.query(Alias).filter(Alias.key_id == key.id, Alias.email_hmac == email_hmac).first()
            return destination_of(alias)
    return None


def _text(forwarded: int, blocked: int, top: list[Alias]) -> str:
    lines = [
        "Bonjour,",
        "",
        "Voici votre rapport Veilix des 7 derniers jours :",
        f"  - {forwarded} e-mail(s) transféré(s) vers votre boîte",
        f"  - {blocked} e-mail(s) bloqué(s) avant d'arriver chez vous",
    ]
    if top:
        lines += ["", "Vos alias les plus ciblés par des e-mails bloqués :"]
        lines += [f"  - {alias.alias_email} : {alias.blocked_count} au total" for alias in top]
    lines += [
        "",
        "Un alias reçoit trop d'e-mails indésirables ? Coupez-le en un clic depuis votre tableau de bord.",
        "Pour ne plus recevoir ce rapport : Paramètres › Confidentialité et données.",
        "",
        "--",
        "",
        "Your Veilix report for the last 7 days:",
        f"  - {forwarded} email(s) forwarded to your inbox",
        f"  - {blocked} email(s) blocked before reaching you",
        "To stop this report: Settings › Privacy and data.",
    ]
    return "\n".join(lines)


def send_due(db: Session, now: datetime | None = None) -> int:
    now = now or _utc_now()
    sent = 0
    due = db.query(Key).filter(
        Key.weekly_digest.is_(True),
        Key.status == "active",
        (Key.digest_sent_at.is_(None)) | (Key.digest_sent_at <= now - PERIOD),
    ).all()
    for key in due:
        if key.digest_sent_at is None:
            reset_baseline(db, key, now)
            db.commit()
            continue
        forwarded, blocked = totals(db, key)
        recipient = _recipient(db, key)
        if recipient:
            top = (
                db.query(Alias)
                .filter(Alias.key_id == key.id, Alias.blocked_count > 0)
                .order_by(Alias.blocked_count.desc())
                .limit(TOP_ALIASES)
                .all()
            )
            try:
                email_service._send_text(recipient, "Votre rapport Veilix de la semaine", _text(
                    max(forwarded - key.digest_forwarded_base, 0),
                    max(blocked - key.digest_blocked_base, 0),
                    top,
                ))
                sent += 1
            except Exception as exc:
                logger.error("Envoi du rapport hebdomadaire impossible : %s", type(exc).__name__)
                continue
        reset_baseline(db, key, now)
        db.commit()
    return sent
