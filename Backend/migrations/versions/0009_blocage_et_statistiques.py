from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0009_blocage_et_statistiques"
down_revision: Union[str, Sequence[str], None] = "0008_resilience_email"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("aliases", sa.Column("forwarded_count", sa.Integer(), server_default="0", nullable=False))
    op.add_column("aliases", sa.Column("blocked_count", sa.Integer(), server_default="0", nullable=False))
    op.create_table(
        "blocked_senders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("alias_id", sa.Integer(), nullable=False),
        sa.Column("pattern_hmac", sa.String(length=64), nullable=False),
        sa.Column("pattern_encrypted", sa.String(), nullable=False),
        sa.Column("key_version", sa.Integer(), nullable=False),
        sa.Column("blocked_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["alias_id"], ["aliases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("alias_id", "pattern_hmac", name="uq_blocked_senders_alias_pattern"),
    )
    op.create_index("ix_blocked_senders_id", "blocked_senders", ["id"], unique=False)
    op.create_index("ix_blocked_senders_alias_id", "blocked_senders", ["alias_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_blocked_senders_alias_id", table_name="blocked_senders")
    op.drop_index("ix_blocked_senders_id", table_name="blocked_senders")
    op.drop_table("blocked_senders")
    op.drop_column("aliases", "blocked_count")
    op.drop_column("aliases", "forwarded_count")
