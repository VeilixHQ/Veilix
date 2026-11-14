from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.db.base import Base

class Key(Base):
    __tablename__ = "keys"

    id = Column(Integer, primary_key=True, index=True)
    key_id = Column(String, unique=True, index=True, nullable=False)
    recovery_email = Column(String, nullable=True)
    plan = Column(String, default="pro", nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    status = Column(String, default="active", nullable=False)
    credits = Column(Integer, default=0, nullable=False)
    last_seen_at = Column(DateTime, nullable=True)