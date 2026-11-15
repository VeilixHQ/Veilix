from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, Boolean, false
from app.db.base import Base


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Key(Base):
    __tablename__ = "keys"

    id = Column(Integer, primary_key=True, index=True)
    key_id = Column(String, unique=True, index=True, nullable=False)
    recovery_email = Column(String, nullable=True)
    plan = Column(String, default="pro", server_default="pro", nullable=False)
    is_admin = Column(Boolean, default=False, server_default=false(), nullable=False)
    status = Column(String, default="active", server_default="active", nullable=False)
    credits = Column(Integer, default=0, server_default="0", nullable=False)
    created_at = Column(DateTime, nullable=True, default=_utc_now)
    last_seen_at = Column(DateTime, nullable=True)
