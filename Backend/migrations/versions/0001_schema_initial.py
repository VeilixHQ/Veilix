from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_schema_initial"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "keys",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key_id", sa.String(), nullable=False),
        sa.Column("plan", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("recovery_email", sa.String(), nullable=True),
        sa.Column("credits", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(), nullable=True),
        sa.Column("last_alias_created_at", sa.DateTime(), nullable=True),
        sa.Column("is_admin", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="keys_pkey"),
    )
    op.create_index("ix_keys_id", "keys", ["id"], unique=False)
    op.create_index("ix_keys_key_id", "keys", ["key_id"], unique=True)

    op.create_table(
        "aliases",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key_id", sa.Integer(), nullable=False),
        sa.Column("alias_email", sa.String(), nullable=False),
        sa.Column("destination_email", sa.String(), nullable=False),
        sa.Column("key_version", sa.Integer(), nullable=False),
        sa.Column("email_hmac", sa.String(), nullable=False),
        sa.Column("label", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["key_id"], ["keys.id"], name="aliases_key_id_fkey"),
        sa.PrimaryKeyConstraint("id", name="aliases_pkey"),
    )
    op.create_index("ix_aliases_id", "aliases", ["id"], unique=False)
    op.create_index("ix_aliases_alias_email", "aliases", ["alias_email"], unique=True)
    op.create_index("ix_aliases_email_hmac", "aliases", ["email_hmac"], unique=False)

    op.create_table(
        "destination_verifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key_id", sa.Integer(), nullable=False),
        sa.Column("email_hmac", sa.String(), nullable=False),
        sa.Column("token_hash", sa.String(), nullable=True),
        sa.Column("token_expires_at", sa.DateTime(), nullable=True),
        sa.Column("verified_at", sa.DateTime(), nullable=True),
        sa.Column("last_sent_at", sa.DateTime(), nullable=True),
        sa.Column("window_started_at", sa.DateTime(), nullable=True),
        sa.Column("sent_in_window", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["key_id"], ["keys.id"], name="destination_verifications_key_id_fkey"),
        sa.PrimaryKeyConstraint("id", name="destination_verifications_pkey"),
        sa.UniqueConstraint("key_id", "email_hmac", name="uq_destination_verifications_key_email"),
    )
    op.create_index("ix_destination_verifications_id", "destination_verifications", ["id"], unique=False)
    op.create_index("ix_destination_verifications_key_id", "destination_verifications", ["key_id"], unique=False)
    op.create_index("ix_destination_verifications_email_hmac", "destination_verifications", ["email_hmac"], unique=False)
    op.create_index("ix_destination_verifications_token_hash", "destination_verifications", ["token_hash"], unique=False)


def downgrade() -> None:
    op.drop_table("destination_verifications")
    op.drop_table("aliases")
    op.drop_table("keys")
