from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, CheckConstraint

from app.db.base import Base


class AccessCode(Base):
    __tablename__ = "access_codes"
    __table_args__ = (
        CheckConstraint("phase IN ('private', 'public')", name="ck_access_codes_phase"),
        CheckConstraint("status IN ('unused', 'used', 'revoked', 'released')", name="ck_access_codes_status"),
    )

    id = Column(Integer, primary_key=True)
    code_hash = Column(String(64), unique=True, nullable=False)
    phase = Column(String(16), nullable=False)
    status = Column(String(16), nullable=False, default="unused", server_default="unused")
    created_at = Column(DateTime, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    key_id = Column(Integer, ForeignKey("keys.id", ondelete="SET NULL"), unique=True, nullable=True)
    signup_id = Column(Integer, ForeignKey("beta_signups.id", ondelete="SET NULL"), unique=True, nullable=True)
