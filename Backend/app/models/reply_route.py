from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.db.base import Base


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ReplyRoute(Base):
    __tablename__ = "reply_routes"

    id = Column(Integer, primary_key=True)
    alias_id = Column(Integer, ForeignKey("aliases.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    sender_email = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=_utc_now)
