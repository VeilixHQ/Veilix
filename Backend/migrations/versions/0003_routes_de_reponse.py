from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003_routes_de_reponse"
down_revision: Union[str, Sequence[str], None] = "0002_alignement_cles"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "reply_routes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("alias_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("sender_email", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["alias_id"], ["aliases.id"], name="reply_routes_alias_id_fkey", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="reply_routes_pkey"),
    )
    op.create_index("ix_reply_routes_alias_id", "reply_routes", ["alias_id"], unique=False)
    op.create_index("ix_reply_routes_token_hash", "reply_routes", ["token_hash"], unique=True)


def downgrade() -> None:
    op.drop_table("reply_routes")
