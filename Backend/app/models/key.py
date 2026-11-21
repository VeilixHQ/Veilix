from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, DateTime, Boolean, CheckConstraint, Text, false, true
from app.db.base import Base


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Key(Base):
    __tablename__ = "keys"
    __table_args__ = (
        CheckConstraint("plan IN ('credits', 'pro', 'pack', 'premium')", name="ck_keys_plan"),
        CheckConstraint("credits >= 0", name="ck_keys_credits_positifs"),
        CheckConstraint("status IN ('active', 'suspended', 'pending_payment')", name="ck_keys_status"),
        CheckConstraint("founder_number BETWEEN 1 AND 100", name="ck_keys_founder_number"),
    )

    id = Column(Integer, primary_key=True, index=True)
    key_id = Column(String, unique=True, index=True, nullable=False)
    contact_email = Column(String, nullable=True)
    contact_email_hmac = Column(String(64), unique=True, nullable=True)
    terms_version = Column(String(32), nullable=True)
    terms_accepted_at = Column(DateTime, nullable=True)
    founder_number = Column(Integer, unique=True, nullable=True)
    plan = Column(String, default="pro", server_default="pro", nullable=False)
    is_admin = Column(Boolean, default=False, server_default=false(), nullable=False)
    status = Column(String, default="active", server_default="active", nullable=False)
    credits = Column(Integer, default=0, server_default="0", nullable=False)
    created_at = Column(DateTime, nullable=True, default=_utc_now)
    last_seen_at = Column(DateTime, nullable=True)
    suspension_reason = Column(String(16), nullable=True)
    feedback_due_at = Column(DateTime, nullable=True)
    feedback_notified_at = Column(DateTime, nullable=True)
    feedback_reminded_at = Column(DateTime, nullable=True)
    final_feedback_at = Column(DateTime, nullable=True)
    beta_closed_notified_at = Column(DateTime, nullable=True)
    reply_complaints = Column(Integer, default=0, server_default="0", nullable=False)
    reply_complaints_since = Column(DateTime, nullable=True)
    pgp_public_key = Column(Text, nullable=True)
    pgp_fingerprint = Column(String(64), nullable=True)
    pgp_enabled = Column(Boolean, default=False, server_default=false(), nullable=False)
    leak_alerts = Column(Boolean, default=True, server_default=true(), nullable=False)
    weekly_digest = Column(Boolean, default=False, server_default=false(), nullable=False)
    digest_sent_at = Column(DateTime, nullable=True)
    digest_forwarded_base = Column(Integer, default=0, server_default="0", nullable=False)
    digest_blocked_base = Column(Integer, default=0, server_default="0", nullable=False)
