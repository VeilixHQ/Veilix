from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0015_liste_lancement"
down_revision: Union[str, Sequence[str], None] = "0014_acquisition_par_canal"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "launch_signups",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("email_hmac", sa.String(length=64), nullable=False),
        sa.Column("consent_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="launch_signups_pkey"),
        sa.UniqueConstraint("email_hmac", name="uq_launch_signups_email_hmac"),
    )


def downgrade() -> None:
    op.drop_table("launch_signups")
