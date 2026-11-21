from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0010_domaines_personnalises"
down_revision: Union[str, Sequence[str], None] = "0009_blocage_et_statistiques"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "custom_domains",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key_id", sa.Integer(), nullable=False),
        sa.Column("domain", sa.String(length=253), nullable=False),
        sa.Column("verification_token", sa.String(length=64), nullable=False),
        sa.Column("verified_at", sa.DateTime(), nullable=True),
        sa.Column("last_checked_at", sa.DateTime(), nullable=True),
        sa.Column("mailgun_registered", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("mailgun_records", sa.Text(), nullable=True),
        sa.Column("catch_all", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("catch_all_destination", sa.String(), nullable=True),
        sa.Column("catch_all_destination_hmac", sa.String(length=64), nullable=True),
        sa.Column("catch_all_key_version", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["key_id"], ["keys.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_custom_domains_id", "custom_domains", ["id"], unique=False)
    op.create_index("ix_custom_domains_key_id", "custom_domains", ["key_id"], unique=False)
    op.create_index("ix_custom_domains_domain", "custom_domains", ["domain"], unique=True)
    op.add_column("aliases", sa.Column("domain_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_aliases_domain_id", "aliases", "custom_domains", ["domain_id"], ["id"], ondelete="CASCADE")
    op.create_index("ix_aliases_domain_id", "aliases", ["domain_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_aliases_domain_id", table_name="aliases")
    op.drop_constraint("fk_aliases_domain_id", "aliases", type_="foreignkey")
    op.drop_column("aliases", "domain_id")
    op.drop_index("ix_custom_domains_domain", table_name="custom_domains")
    op.drop_index("ix_custom_domains_key_id", table_name="custom_domains")
    op.drop_index("ix_custom_domains_id", table_name="custom_domains")
    op.drop_table("custom_domains")
