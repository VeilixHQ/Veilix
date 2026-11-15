from typing import Sequence, Union

from alembic import op

revision: str = "0004_plans_et_credits"
down_revision: Union[str, Sequence[str], None] = "0003_routes_de_reponse"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PLANS = ("credits", "pro", "pack", "premium")


def upgrade() -> None:
    op.execute("UPDATE keys SET plan = 'pro' WHERE plan = 'starter'")
    op.execute("UPDATE keys SET plan = 'pack' WHERE plan = 'launch'")
    allowed = ", ".join(f"'{plan}'" for plan in PLANS)
    op.execute(f"UPDATE keys SET plan = 'credits' WHERE plan NOT IN ({allowed})")
    op.execute("UPDATE keys SET credits = 0 WHERE credits < 0")
    op.create_check_constraint("ck_keys_plan", "keys", f"plan IN ({allowed})")
    op.create_check_constraint("ck_keys_credits_positifs", "keys", "credits >= 0")


def downgrade() -> None:
    op.drop_constraint("ck_keys_credits_positifs", "keys", type_="check")
    op.drop_constraint("ck_keys_plan", "keys", type_="check")
