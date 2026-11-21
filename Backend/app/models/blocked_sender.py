from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint

from app.db.base import Base


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class BlockedSender(Base):
    __tablename__ = "blocked_senders"
    __table_args__ = (
        UniqueConstraint("alias_id", "pattern_hmac", name="uq_blocked_senders_alias_pattern"),
    )

    id = Column(Integer, primary_key=True, index=True)
    alias_id = Column(Integer, ForeignKey("aliases.id", ondelete="CASCADE"), nullable=False, index=True)
    pattern_hmac = Column(String(64), nullable=False)
    pattern_encrypted = Column(String, nullable=False)
    key_version = Column(Integer, nullable=False, default=1)
    blocked_count = Column(Integer, nullable=False, default=0, server_default="0")
    created_at = Column(DateTime, nullable=False, default=_utc_now)
