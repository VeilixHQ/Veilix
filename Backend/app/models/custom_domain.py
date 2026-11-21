from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, false

from app.db.base import Base


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class CustomDomain(Base):
    __tablename__ = "custom_domains"

    id = Column(Integer, primary_key=True, index=True)
    key_id = Column(Integer, ForeignKey("keys.id", ondelete="CASCADE"), nullable=False, index=True)
    domain = Column(String(253), nullable=False, unique=True, index=True)
    verification_token = Column(String(64), nullable=False)
    verified_at = Column(DateTime, nullable=True)
    last_checked_at = Column(DateTime, nullable=True)
    mailgun_registered = Column(Boolean, nullable=False, default=False, server_default=false())
    mailgun_records = Column(Text, nullable=True)
    catch_all = Column(Boolean, nullable=False, default=False, server_default=false())
    catch_all_destination = Column(String, nullable=True)
    catch_all_destination_hmac = Column(String(64), nullable=True)
    catch_all_key_version = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, default=_utc_now)
