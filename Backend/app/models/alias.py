from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime, timezone
from app.db.base import Base
from app.models.custom_domain import CustomDomain

__all__ = ["Alias", "CustomDomain"]

class Alias(Base):
    __tablename__ = "aliases"
    id                = Column(Integer, primary_key=True, index=True)
    key_id            = Column(Integer, ForeignKey("keys.id"), nullable=False)
    alias_email       = Column(String, unique=True, nullable=False, index=True)

    destination_email = Column(String, nullable=False)
    key_version       = Column(Integer, nullable=False, default=1)


    email_hmac        = Column(String, nullable=False, index=True)

    label             = Column(String, nullable=True)
    status            = Column(String, default="active")
    forwarded_count   = Column(Integer, nullable=False, default=0, server_default="0")
    blocked_count     = Column(Integer, nullable=False, default=0, server_default="0")
    leak_detected_at  = Column(DateTime, nullable=True)
    domain_id         = Column(Integer, ForeignKey("custom_domains.id", ondelete="CASCADE"), nullable=True, index=True)
    created_at        = Column(DateTime, default=lambda: datetime.now(timezone.utc))