from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.db.base import Base


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ApiToken(Base):
    __tablename__ = "api_tokens"

    id = Column(Integer, primary_key=True, index=True)
    key_id = Column(Integer, ForeignKey("keys.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(64), nullable=False)
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    prefix = Column(String(16), nullable=False)
    created_at = Column(DateTime, nullable=False, default=_utc_now)
