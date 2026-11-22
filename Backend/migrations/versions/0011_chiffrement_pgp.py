from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0011_chiffrement_pgp"
down_revision: Union[str, Sequence[str], None] = "0010_domaines_personnalises"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("keys", sa.Column("pgp_public_key", sa.Text(), nullable=True))
    op.add_column("keys", sa.Column("pgp_fingerprint", sa.String(length=64), nullable=True))
    op.add_column("keys", sa.Column("pgp_enabled", sa.Boolean(), server_default=sa.false(), nullable=False))


def downgrade() -> None:
    op.drop_column("keys", "pgp_enabled")
    op.drop_column("keys", "pgp_fingerprint")
    op.drop_column("keys", "pgp_public_key")
