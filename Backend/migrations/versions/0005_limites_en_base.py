from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005_limites_en_base"
down_revision: Union[str, Sequence[str], None] = "0004_plans_et_credits"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rate_limits",
        sa.Column("bucket", sa.String(length=64), nullable=False),
        sa.Column("window_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("hits", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("bucket", name="rate_limits_pkey"),
    )
    op.create_index("ix_rate_limits_window_start", "rate_limits", ["window_start"], unique=False)
    op.create_table(
        "webhook_tokens",
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("token_hash", name="webhook_tokens_pkey"),
    )
    op.create_index("ix_webhook_tokens_claimed_at", "webhook_tokens", ["claimed_at"], unique=False)


def downgrade() -> None:
    op.drop_table("webhook_tokens")
    op.drop_table("rate_limits")
