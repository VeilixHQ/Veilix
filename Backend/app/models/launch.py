from sqlalchemy import Column, DateTime, Integer, String

from app.db.base import Base


class LaunchSignup(Base):
    __tablename__ = "launch_signups"

    id = Column(Integer, primary_key=True)
    email = Column(String, nullable=False)
    email_hmac = Column(String(64), unique=True, nullable=False)
    consent_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False)
