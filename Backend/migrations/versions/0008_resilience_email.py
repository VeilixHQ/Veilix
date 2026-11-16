from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0008_resilience_email"
down_revision: Union[str, Sequence[str], None] = "0007_inscription_beta"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("webhook_tokens", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True))
    op.execute("UPDATE webhook_tokens SET completed_at = claimed_at")

    op.create_table(
        "inbound_messages",
        sa.Column("message_hash", sa.String(length=64), nullable=False),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("result", sa.String(length=16), nullable=True),
        sa.PrimaryKeyConstraint("message_hash", name="inbound_messages_pkey"),
    )
    op.create_index("ix_inbound_messages_claimed_at", "inbound_messages", ["claimed_at"], unique=False)

    op.create_table(
        "destination_health",
        sa.Column("email_hmac", sa.String(length=64), nullable=False),
        sa.Column("state", sa.String(length=16), server_default="healthy", nullable=False),
        sa.Column("reason", sa.String(length=16), nullable=True),
        sa.Column("soft_failures", sa.Integer(), server_default="0", nullable=False),
        sa.Column("first_soft_failure_at", sa.DateTime(), nullable=True),
        sa.Column("complaints", sa.Integer(), server_default="0", nullable=False),
        sa.Column("first_complaint_at", sa.DateTime(), nullable=True),
        sa.Column("last_event_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint("state IN ('healthy', 'degraded', 'suspended')", name="ck_destination_health_state"),
        sa.PrimaryKeyConstraint("email_hmac", name="destination_health_pkey"),
    )


    op.add_column("keys", sa.Column("reply_complaints", sa.Integer(), server_default="0", nullable=False))
    op.add_column("keys", sa.Column("reply_complaints_since", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("keys", "reply_complaints_since")
    op.drop_column("keys", "reply_complaints")
    op.drop_table("destination_health")
    op.drop_table("inbound_messages")
    op.drop_column("webhook_tokens", "completed_at")
