from sqlalchemy import CheckConstraint, Column, DateTime, Integer, String

from app.db.base import Base


class DestinationHealth(Base):
    __tablename__ = "destination_health"
    __table_args__ = (
        CheckConstraint("state IN ('healthy', 'degraded', 'suspended')", name="ck_destination_health_state"),
    )

    email_hmac = Column(String(64), primary_key=True)
    state = Column(String(16), nullable=False, default="healthy", server_default="healthy")
    reason = Column(String(16), nullable=True)
    soft_failures = Column(Integer, nullable=False, default=0, server_default="0")
    first_soft_failure_at = Column(DateTime, nullable=True)
    complaints = Column(Integer, nullable=False, default=0, server_default="0")
    first_complaint_at = Column(DateTime, nullable=True)
    last_event_at = Column(DateTime, nullable=True)
