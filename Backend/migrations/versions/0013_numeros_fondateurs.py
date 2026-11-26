from typing import Sequence, Union

from alembic import op

revision: str = "0013_numeros_fondateurs"
down_revision: Union[str, Sequence[str], None] = "0012_alertes_cles_api_rapport"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE keys SET founder_number = classement.numero
        FROM (
            SELECT id, (SELECT COALESCE(MAX(founder_number), 0) FROM keys) + ROW_NUMBER() OVER (ORDER BY created_at NULLS LAST, id) AS numero
            FROM keys
            WHERE plan = 'pack' AND NOT is_admin AND founder_number IS NULL
        ) AS classement
        WHERE keys.id = classement.id AND classement.numero <= 100
        """
    )


def downgrade() -> None:
    pass
