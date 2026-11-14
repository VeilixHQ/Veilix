# Backend/app/plans.py
import os

# Clés administrateur (séparées par des virgules), lues dans l'environnement du serveur
ADMIN_KEYS = {k.strip() for k in os.getenv("ADMIN_KEY_IDS", "").split(",") if k.strip()}

# None = illimité
PLAN_QUOTAS = {
    "pro": 100,
    "pack": None,
    "admin": None,
}


def get_effective_plan(key_id: str, current_plan: str) -> str:
    """Plan effectif : 'admin' si la clé est dans ADMIN_KEY_IDS, sinon le plan en base.
    L'ancien plan 'starter' (ou vide) est ramené vers 'pro'."""
    if key_id in ADMIN_KEYS:
        return "admin"
    if not current_plan or current_plan == "starter":
        return "pro"
    return current_plan


def can_create_alias(plan: str, current_count: int) -> bool:
    # Plan inconnu (ex. 'free', 'none') = refusé. Avant, .get() renvoyait None
    # pour un plan inconnu, ce qui était interprété comme "illimité".
    if plan not in PLAN_QUOTAS:
        return False
    limit = PLAN_QUOTAS[plan]
    return limit is None or current_count < limit