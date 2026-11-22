from datetime import datetime, timedelta, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.encryption import hash_email
from app.models.alias import Alias
from app.models.alias_sender import AliasSender
from app.models.key import Key
from app.plans import get_effective_plan, has_pack_features

LEARNING_DAYS = 7
MULTI_PART_SUFFIXES = {
    "co.uk", "org.uk", "ac.uk", "gov.uk", "me.uk", "com.au", "net.au", "org.au", "co.nz", "co.jp", "ne.jp",
    "com.br", "com.mx", "com.tr", "co.za", "com.cn", "com.hk", "co.in", "co.kr", "com.sg", "gouv.fr", "asso.fr",
}
SUBJECT_TAG = "[Fuite possible] "
NOTICE = (
    "[Veilix] Alerte fuite : cet alias reçoit pour la première fois des e-mails de {domain}, "
    "différent des expéditeurs habituels. Votre adresse a peut-être été partagée ou exposée. "
    "Si ce message n'est pas légitime, coupez l'alias en un clic depuis votre tableau de bord."
)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def registrable_domain(sender: str) -> str | None:
    domain = (sender or "").rpartition("@")[2].strip().lower().rstrip(".")
    labels = [label for label in domain.split(".") if label]
    if len(labels) < 2:
        return None
    if len(labels) >= 3 and ".".join(labels[-2:]) in MULTI_PART_SUFFIXES:
        return ".".join(labels[-3:])
    return ".".join(labels[-2:])


def _naive(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value.astimezone(timezone.utc).replace(tzinfo=None) if value.tzinfo else value


def observe(db: Session, alias: Alias, sender: str, now: datetime | None = None) -> str | None:
    now = now or _utc_now()
    domain = registrable_domain(sender)
    if domain is None:
        return None
    domain_hmac = hash_email(f"sender-domain:{domain}")
    if db.query(AliasSender.id).filter(AliasSender.alias_id == alias.id, AliasSender.domain_hmac == domain_hmac).first():
        return None
    had_senders = db.query(AliasSender.id).filter(AliasSender.alias_id == alias.id).first() is not None
    db.add(AliasSender(alias_id=alias.id, domain_hmac=domain_hmac, first_seen_at=now))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return None
    created_at = _naive(alias.created_at)
    learning = created_at is not None and now - created_at < timedelta(days=LEARNING_DAYS)
    if not had_senders or learning:
        return None
    if alias.leak_detected_at is None:
        alias.leak_detected_at = now
        db.commit()
    return domain


def alerts_enabled(key: Key | None) -> bool:
    if not key or not key.leak_alerts:
        return False
    return has_pack_features(get_effective_plan(key.key_id, key.plan, key.is_admin))


def dismiss(db: Session, alias: Alias) -> Alias:
    alias.leak_detected_at = None
    db.commit()
    db.refresh(alias)
    return alias
