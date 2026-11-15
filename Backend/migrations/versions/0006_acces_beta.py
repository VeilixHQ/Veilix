from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0006_acces_beta"
down_revision: Union[str, Sequence[str], None] = "0005_limites_en_base"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("keys", "recovery_email", new_column_name="contact_email")
    op.add_column("keys", sa.Column("contact_email_hmac", sa.String(length=64), nullable=True))
    op.add_column("keys", sa.Column("terms_version", sa.String(length=32), nullable=True))
    op.add_column("keys", sa.Column("terms_accepted_at", sa.DateTime(), nullable=True))
    op.add_column("keys", sa.Column("founder_number", sa.Integer(), nullable=True))
    op.create_unique_constraint("uq_keys_contact_email_hmac", "keys", ["contact_email_hmac"])
    op.create_unique_constraint("uq_keys_founder_number", "keys", ["founder_number"])
    op.execute("UPDATE keys SET status = 'suspended' WHERE status NOT IN ('active', 'suspended', 'pending_payment')")
    op.create_check_constraint("ck_keys_status", "keys", "status IN ('active', 'suspended', 'pending_payment')")
    op.create_check_constraint("ck_keys_founder_number", "keys", "founder_number BETWEEN 1 AND 100")

    op.create_table(
        "access_codes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code_hash", sa.String(length=64), nullable=False),
        sa.Column("phase", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=16), server_default="unused", nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used_at", sa.DateTime(), nullable=True),
        sa.Column("key_id", sa.Integer(), nullable=True),
        sa.CheckConstraint("phase IN ('private', 'public')", name="ck_access_codes_phase"),
        sa.CheckConstraint("status IN ('unused', 'used', 'revoked')", name="ck_access_codes_status"),
        sa.ForeignKeyConstraint(["key_id"], ["keys.id"], name="access_codes_key_id_fkey", ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name="access_codes_pkey"),
        sa.UniqueConstraint("code_hash", name="uq_access_codes_code_hash"),
        sa.UniqueConstraint("key_id", name="uq_access_codes_key_id"),
    )


def downgrade() -> None:
    op.drop_table("access_codes")
    op.drop_constraint("ck_keys_founder_number", "keys", type_="check")
    op.drop_constraint("ck_keys_status", "keys", type_="check")
    op.drop_constraint("uq_keys_founder_number", "keys", type_="unique")
    op.drop_constraint("uq_keys_contact_email_hmac", "keys", type_="unique")
    op.drop_column("keys", "founder_number")
    op.drop_column("keys", "terms_accepted_at")
    op.drop_column("keys", "terms_version")
    op.drop_column("keys", "contact_email_hmac")
    op.alter_column("keys", "contact_email", new_column_name="recovery_email")
