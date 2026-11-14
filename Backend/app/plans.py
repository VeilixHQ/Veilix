from app.core.config import ADMIN_KEY_IDS
from app.core.keys import stored_key_id

ADMIN_KEYS = {stored_key_id(k.strip()) for k in ADMIN_KEY_IDS.split(",") if k.strip()}

PLAN_QUOTAS = {
    "pro": 100,
    "pack": None,
    "admin": None,
}


def get_effective_plan(key_id: str, current_plan: str) -> str:
    if key_id in ADMIN_KEYS:
        return "admin"
    if not current_plan or current_plan == "starter":
        return "pro"
    return current_plan


def can_create_alias(plan: str, current_count: int) -> bool:
    if plan not in PLAN_QUOTAS:
        return False
    limit = PLAN_QUOTAS[plan]
    return limit is None or current_count < limit