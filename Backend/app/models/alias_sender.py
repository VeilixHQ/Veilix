from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint

from app.db.base import Base


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class AliasSender(Base):
    __tablename__ = "alias_senders"
    __table_args__ = (
        UniqueConstraint("alias_id", "domain_hmac", name="uq_alias_senders_alias_domain"),
    )

    id = Column(Integer, primary_key=True)
    alias_id = Column(Integer, ForeignKey("aliases.id", ondelete="CASCADE"), nullable=False, index=True)
    domain_hmac = Column(String(64), nullable=False)
    first_seen_at = Column(DateTime, nullable=False, default=_utc_now)
