from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0007_inscription_beta"
down_revision: Union[str, Sequence[str], None] = "0006_acces_beta"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "beta_signups",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("phase", sa.String(length=16), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("email_hmac", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=16), server_default="waiting", nullable=False),
        sa.Column("consent_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("queued_at", sa.DateTime(), nullable=False),
        sa.Column("invited_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint("phase IN ('private', 'public')", name="ck_beta_signups_phase"),
        sa.CheckConstraint("status IN ('waiting', 'invited', 'registered', 'expired')", name="ck_beta_signups_status"),
        sa.PrimaryKeyConstraint("id", name="beta_signups_pkey"),
        sa.UniqueConstraint("email_hmac", name="uq_beta_signups_email_hmac"),
    )
    op.create_index("ix_beta_signups_queued_at", "beta_signups", ["queued_at"], unique=False)

    op.create_table(
        "beta_feedback",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key_id", sa.Integer(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(), nullable=False),
        sa.Column("is_final", sa.Boolean(), nullable=False),
        sa.Column("answers", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["key_id"], ["keys.id"], name="beta_feedback_key_id_fkey", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="beta_feedback_pkey"),
    )
    op.create_index("ix_beta_feedback_key_id", "beta_feedback", ["key_id"], unique=False)

    op.add_column("access_codes", sa.Column("signup_id", sa.Integer(), nullable=True))
    op.create_foreign_key("access_codes_signup_id_fkey", "access_codes", "beta_signups", ["signup_id"], ["id"], ondelete="SET NULL")
    op.create_unique_constraint("uq_access_codes_signup_id", "access_codes", ["signup_id"])
    op.drop_constraint("ck_access_codes_status", "access_codes", type_="check")
    op.create_check_constraint("ck_access_codes_status", "access_codes", "status IN ('unused', 'used', 'revoked', 'released')")

    op.add_column("keys", sa.Column("suspension_reason", sa.String(length=16), nullable=True))
    op.add_column("keys", sa.Column("feedback_due_at", sa.DateTime(), nullable=True))
    op.add_column("keys", sa.Column("feedback_notified_at", sa.DateTime(), nullable=True))
    op.add_column("keys", sa.Column("feedback_reminded_at", sa.DateTime(), nullable=True))
    op.add_column("keys", sa.Column("final_feedback_at", sa.DateTime(), nullable=True))
    op.add_column("keys", sa.Column("beta_closed_notified_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("keys", "beta_closed_notified_at")
    op.drop_column("keys", "final_feedback_at")
    op.drop_column("keys", "feedback_reminded_at")
    op.drop_column("keys", "feedback_notified_at")
    op.drop_column("keys", "feedback_due_at")
    op.drop_column("keys", "suspension_reason")
    op.execute("UPDATE access_codes SET status = 'revoked' WHERE status = 'released'")
    op.drop_constraint("ck_access_codes_status", "access_codes", type_="check")
    op.create_check_constraint("ck_access_codes_status", "access_codes", "status IN ('unused', 'used', 'revoked')")
    op.drop_constraint("uq_access_codes_signup_id", "access_codes", type_="unique")
    op.drop_constraint("access_codes_signup_id_fkey", "access_codes", type_="foreignkey")
    op.drop_column("access_codes", "signup_id")
    op.drop_table("beta_feedback")
    op.drop_table("beta_signups")
