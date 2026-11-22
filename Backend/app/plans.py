from dataclasses import dataclass

from app.core.config import ADMIN_KEY_IDS
from app.core.keys import stored_key_id

ADMIN_KEYS = {stored_key_id(k.strip()) for k in ADMIN_KEY_IDS.split(",") if k.strip()}

PLAN_QUOTAS = {
    "credits": 0,
    "pro": 100,
    "pack": None,
    "premium": None,
    "admin": None,
}

STORED_PLANS = tuple(plan for plan in PLAN_QUOTAS if plan != "admin")

DESTINATION_LIMITS = {
    "credits": 3,
    "pro": 3,
    "pack": 10,
    "premium": 10,
    "admin": None,
}

PACK_PLANS = {"pack", "premium", "admin"}

LIMIT_DETAILS = {
    "credits": "NO_CREDITS",
    "pro": "LIMIT_REACHED_PRO",
}


@dataclass(frozen=True)
class AliasAllowance:
    allowed: bool
    uses_credit: bool


def get_effective_plan(key_id: str, current_plan: str, is_admin: bool = False) -> str:
    if is_admin or key_id in ADMIN_KEYS:
        return "admin"
    return current_plan


def alias_quota(plan: str) -> int | None:
    return PLAN_QUOTAS.get(plan, 0)


def check_alias_allowance(plan: str, current_count: int, credits: int) -> AliasAllowance:
    if plan not in PLAN_QUOTAS:
        return AliasAllowance(allowed=False, uses_credit=False)
    limit = PLAN_QUOTAS[plan]
    if limit is None or current_count < limit:
        return AliasAllowance(allowed=True, uses_credit=False)
    if credits > 0:
        return AliasAllowance(allowed=True, uses_credit=True)
    return AliasAllowance(allowed=False, uses_credit=False)


def destination_limit(plan: str) -> int | None:
    return DESTINATION_LIMITS.get(plan, 3)


def has_pack_features(plan: str) -> bool:
    return plan in PACK_PLANS


def limit_detail(plan: str) -> str:
    return LIMIT_DETAILS.get(plan, "LIMIT_REACHED")
