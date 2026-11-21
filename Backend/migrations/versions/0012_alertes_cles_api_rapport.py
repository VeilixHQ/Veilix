from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0012_alertes_cles_api_rapport"
down_revision: Union[str, Sequence[str], None] = "0011_chiffrement_pgp"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("keys", sa.Column("leak_alerts", sa.Boolean(), server_default=sa.true(), nullable=False))
    op.add_column("keys", sa.Column("weekly_digest", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column("keys", sa.Column("digest_sent_at", sa.DateTime(), nullable=True))
    op.add_column("keys", sa.Column("digest_forwarded_base", sa.Integer(), server_default="0", nullable=False))
    op.add_column("keys", sa.Column("digest_blocked_base", sa.Integer(), server_default="0", nullable=False))
    op.add_column("aliases", sa.Column("leak_detected_at", sa.DateTime(), nullable=True))
    op.create_table(
        "alias_senders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("alias_id", sa.Integer(), nullable=False),
        sa.Column("domain_hmac", sa.String(length=64), nullable=False),
        sa.Column("first_seen_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["alias_id"], ["aliases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("alias_id", "domain_hmac", name="uq_alias_senders_alias_domain"),
    )
    op.create_index("ix_alias_senders_alias_id", "alias_senders", ["alias_id"], unique=False)
    op.create_table(
        "api_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("prefix", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["key_id"], ["keys.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_api_tokens_id", "api_tokens", ["id"], unique=False)
    op.create_index("ix_api_tokens_key_id", "api_tokens", ["key_id"], unique=False)
    op.create_index("ix_api_tokens_token_hash", "api_tokens", ["token_hash"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_api_tokens_token_hash", table_name="api_tokens")
    op.drop_index("ix_api_tokens_key_id", table_name="api_tokens")
    op.drop_index("ix_api_tokens_id", table_name="api_tokens")
    op.drop_table("api_tokens")
    op.drop_index("ix_alias_senders_alias_id", table_name="alias_senders")
    op.drop_table("alias_senders")
    op.drop_column("aliases", "leak_detected_at")
    op.drop_column("keys", "digest_blocked_base")
    op.drop_column("keys", "digest_forwarded_base")
    op.drop_column("keys", "digest_sent_at")
    op.drop_column("keys", "weekly_digest")
    op.drop_column("keys", "leak_alerts")
