from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from datetime import datetime, timezone
from app.db.base import Base

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
    created_at        = Column(DateTime, default=lambda: datetime.now(timezone.utc))