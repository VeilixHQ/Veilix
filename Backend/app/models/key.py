from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from app.db.base import Base

class Key(Base):
    __tablename__ = "keys"
    id                     = Column(Integer, primary_key=True, index=True)
    key_id                 = Column(String, unique=True, nullable=False, index=True)
    plan                   = Column(String, default="starter")   # starter | pro | business
    status                 = Column(String, default="active")    # active | suspended
    recovery_email         = Column(String, nullable=True)
    credits                = Column(Integer, default=0)
    created_at             = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_seen_at           = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_alias_created_at  = Column(DateTime, nullable=True)