from sqlalchemy import CheckConstraint, Column, Date, Integer, String, UniqueConstraint

from app.db.base import Base


class AcquisitionDaily(Base):
    __tablename__ = "acquisition_daily"
    __table_args__ = (
        UniqueConstraint("day", "channel", "event", name="uq_acquisition_daily"),
        CheckConstraint("event IN ('waitlist', 'register')", name="ck_acquisition_event"),
        CheckConstraint("count >= 0", name="ck_acquisition_count"),
    )

    id = Column(Integer, primary_key=True)
    day = Column(Date, nullable=False, index=True)
    channel = Column(String(24), nullable=False)
    event = Column(String(16), nullable=False)
    count = Column(Integer, nullable=False, default=0, server_default="0")
