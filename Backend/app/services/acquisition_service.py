import logging
import re
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.acquisition import AcquisitionDaily

CHANNELS = {
    "x", "reddit", "tiktok", "linkedin", "youtube", "instagram", "facebook", "mastodon", "bluesky", "discord", "telegram",
    "google", "googleads", "bing", "duckduckgo", "qwant", "ecosia", "brave",
    "chatgpt", "perplexity", "claude", "gemini", "copilot", "mistral",
    "newsletter", "github", "producthunt", "presse", "direct", "autre",
}
ALIASES = {"twitter": "x", "t.co": "x", "x.com": "x", "chatgpt.com": "chatgpt", "perplexity.ai": "perplexity", "reddit.com": "reddit", "tiktok.com": "tiktok", "google.com": "google", "le chat": "mistral", "lechat": "mistral", "openai": "chatgpt", "duck": "duckduckgo", "gads": "googleads"}
EVENTS = {"waitlist", "register"}
log = logging.getLogger("veilix.acquisition")


def normalize_channel(raw: str | None) -> str:
    value = re.sub(r"[^a-z0-9. ]", "", (raw or "").strip().lower())[:40]
    if not value:
        return "direct"
    value = ALIASES.get(value, value)
    return value if value in CHANNELS else "autre"


def today() -> date:
    return datetime.now(timezone.utc).date()


def record(db: Session, event: str, raw_channel: str | None, day: date | None = None) -> None:
    if event not in EVENTS:
        raise ValueError("Événement d'acquisition inconnu")
    stmt = insert(AcquisitionDaily).values(day=day or today(), channel=normalize_channel(raw_channel), event=event, count=1)
    stmt = stmt.on_conflict_do_update(constraint="uq_acquisition_daily", set_={"count": AcquisitionDaily.count + 1})
    db.execute(stmt)
    db.commit()


def record_safely(db: Session, event: str, raw_channel: str | None) -> None:
    try:
        record(db, event, raw_channel)
    except SQLAlchemyError:
        db.rollback()
        log.warning("Compteur d'acquisition indisponible")


def summary(db: Session, days: int) -> dict:
    since = today() - timedelta(days=max(1, min(days, 400)) - 1)
    rows = db.execute(
        select(AcquisitionDaily).where(AcquisitionDaily.day >= since).order_by(AcquisitionDaily.day)
    ).scalars().all()
    totals: dict[str, dict[str, int]] = {}
    for row in rows:
        totals.setdefault(row.channel, {"waitlist": 0, "register": 0})[row.event] += row.count
    return {
        "since": since.isoformat(),
        "until": today().isoformat(),
        "totals": totals,
        "daily": [{"day": r.day.isoformat(), "channel": r.channel, "event": r.event, "count": r.count} for r in rows],
    }
