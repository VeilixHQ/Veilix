from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.models.key import Key

PACK_TOTAL = 100
LOCK_ID = 7340119

_NEXT_NUMBER = text(
    """
    SELECT n FROM generate_series(1, :total) AS n
    WHERE n NOT IN (SELECT founder_number FROM keys WHERE founder_number IS NOT NULL)
    ORDER BY n
    LIMIT 1
    """
)


class PackSoldOut(Exception):
    pass


def taken(db: Session) -> int:
    return db.query(func.count(Key.id)).filter(Key.founder_number.isnot(None)).scalar() or 0


def availability(db: Session) -> dict:
    used = min(taken(db), PACK_TOTAL)
    return {"total": PACK_TOTAL, "taken": used, "remaining": PACK_TOTAL - used}


def assign_founder_number(db: Session, key: Key) -> int | None:
    if key.founder_number:
        return key.founder_number
    db.execute(text("SELECT pg_advisory_xact_lock(:lock)"), {"lock": LOCK_ID})
    number = db.execute(_NEXT_NUMBER, {"total": PACK_TOTAL}).scalar()
    if number is None:
        return None
    key.founder_number = number
    db.flush()
    return number


def grant_pack(db: Session, key: Key) -> int:
    number = assign_founder_number(db, key)
    if number is None:
        raise PackSoldOut()
    key.plan = "pack"
    db.flush()
    return number
