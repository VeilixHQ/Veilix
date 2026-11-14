from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from app.db.base import Base

class DestinationVerification(Base):
    __tablename__ = "destination_verifications"
    __table_args__ = (
        UniqueConstraint("key_id", "email_hmac", name="uq_destination_verifications_key_email"),
    )

    id                = Column(Integer, primary_key=True, index=True)
    key_id            = Column(Integer, ForeignKey("keys.id"), nullable=False, index=True)
    email_hmac        = Column(String, nullable=False, index=True)
    token_hash        = Column(String, nullable=True, index=True)
    token_expires_at  = Column(DateTime, nullable=True)
    verified_at       = Column(DateTime, nullable=True)
    last_sent_at      = Column(DateTime, nullable=True)
    window_started_at = Column(DateTime, nullable=True)
    sent_in_window    = Column(Integer, nullable=False, default=0)
    created_at        = Column(DateTime, nullable=False)
