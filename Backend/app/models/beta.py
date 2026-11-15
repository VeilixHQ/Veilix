from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, String, Text

from app.db.base import Base


class BetaSignup(Base):
    __tablename__ = "beta_signups"
    __table_args__ = (
        CheckConstraint("phase IN ('private', 'public')", name="ck_beta_signups_phase"),
        CheckConstraint("status IN ('waiting', 'invited', 'registered', 'expired')", name="ck_beta_signups_status"),
    )

    id = Column(Integer, primary_key=True)
    phase = Column(String(16), nullable=False)
    email = Column(String, nullable=False)
    email_hmac = Column(String(64), unique=True, nullable=False)
    status = Column(String(16), nullable=False, default="waiting", server_default="waiting")
    consent_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False)
    queued_at = Column(DateTime, nullable=False, index=True)
    invited_at = Column(DateTime, nullable=True)


class BetaFeedback(Base):
    __tablename__ = "beta_feedback"

    id = Column(Integer, primary_key=True)
    key_id = Column(Integer, ForeignKey("keys.id", ondelete="CASCADE"), nullable=False, index=True)
    submitted_at = Column(DateTime, nullable=False)
    is_final = Column(Boolean, nullable=False, default=False)
    answers = Column(Text, nullable=False)
