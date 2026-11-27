from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0014_acquisition_par_canal"
down_revision: Union[str, Sequence[str], None] = "0013_numeros_fondateurs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "acquisition_daily",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("day", sa.Date(), nullable=False),
        sa.Column("channel", sa.String(length=24), nullable=False),
        sa.Column("event", sa.String(length=16), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint("day", "channel", "event", name="uq_acquisition_daily"),
        sa.CheckConstraint("event IN ('waitlist', 'register')", name="ck_acquisition_event"),
        sa.CheckConstraint("count >= 0", name="ck_acquisition_count"),
    )
    op.create_index("ix_acquisition_daily_day", "acquisition_daily", ["day"])


def downgrade() -> None:
    op.drop_index("ix_acquisition_daily_day", table_name="acquisition_daily")
    op.drop_table("acquisition_daily")
