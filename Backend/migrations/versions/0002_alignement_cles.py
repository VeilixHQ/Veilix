from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_alignement_cles"
down_revision: Union[str, Sequence[str], None] = "0001_schema_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE keys SET plan = 'pro' WHERE plan IS NULL")
    op.execute("UPDATE keys SET status = 'active' WHERE status IS NULL")
    op.execute("UPDATE keys SET credits = 0 WHERE credits IS NULL")
    with op.batch_alter_table("keys") as batch:
        batch.alter_column("plan", existing_type=sa.String(), nullable=False, server_default="pro")
        batch.alter_column("status", existing_type=sa.String(), nullable=False, server_default="active")
        batch.alter_column("credits", existing_type=sa.Integer(), nullable=False, server_default="0")
        batch.drop_column("last_alias_created_at")


def downgrade() -> None:
    with op.batch_alter_table("keys") as batch:
        batch.add_column(sa.Column("last_alias_created_at", sa.DateTime(), nullable=True))
        batch.alter_column("credits", existing_type=sa.Integer(), nullable=True, server_default=None)
        batch.alter_column("status", existing_type=sa.String(), nullable=True, server_default=None)
        batch.alter_column("plan", existing_type=sa.String(), nullable=True, server_default=None)
