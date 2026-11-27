from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core import config
from app.core.rate_limit import ip_limit
from app.core.security import get_current_key
from app.db.session import get_db
from app.models.key import Key
from app.plans import alias_quota, destination_limit, get_effective_plan
from app.schemas.key import (
    Badge,
    CheckCodeRequest,
    CheckCodeResponse,
    KeyAccountResponse,
    KeyResponse,
    RegisterKeyRequest,
    VerifyKeyRequest,
    VerifyKeyResponse,
)
from app.services import acquisition_service
from app.services.access_service import badges_for, check_code, register_with_code
from app.services.alias_service import count_aliases, destinations_in_use
from app.services.key_service import get_key_by_id

router = APIRouter(tags=["Key"])


@router.post("/key/check-code", response_model=CheckCodeResponse, dependencies=[Depends(ip_limit("check-code", 10, 3600))])
def check(body: CheckCodeRequest, db: Session = Depends(get_db)):
    access = check_code(db, body.access_code)
    if not access:
        return CheckCodeResponse(valid=False)
    return CheckCodeResponse(valid=True, phase=access.phase, needs_contact=access.signup_id is None)


@router.post("/key/register", response_model=KeyResponse, dependencies=[Depends(ip_limit("register", 20, 3600))])
def register(body: RegisterKeyRequest, db: Session = Depends(get_db)):
    key = register_with_code(db, body.key_id, body.access_code, body.contact_email, body.accept_terms)
    acquisition_service.record_safely(db, "register", body.channel)
    return KeyResponse(key_id=body.key_id, plan=key.plan, status=key.status, credits=key.credits, created_at=key.created_at)


@router.post("/key/verify", response_model=VerifyKeyResponse, dependencies=[Depends(ip_limit("verify", 120, 60))])
def verify(body: VerifyKeyRequest, db: Session = Depends(get_db)):
    key = get_key_by_id(db, body.key_id)
    if not key:
        return VerifyKeyResponse(exists=False)

    effective = get_effective_plan(key.key_id, key.plan, key.is_admin)
    return VerifyKeyResponse(exists=True, plan=effective, status=key.status)


@router.get("/key/me", response_model=KeyAccountResponse, dependencies=[Depends(ip_limit("me", 120, 60))])
def me(key: Key = Depends(get_current_key), db: Session = Depends(get_db)):
    plan = get_effective_plan(key.key_id, key.plan, key.is_admin)
    return KeyAccountResponse(
        plan=plan,
        status=key.status,
        credits=key.credits,
        aliases_used=count_aliases(db, key),
        alias_quota=alias_quota(plan),
        destinations_used=len(destinations_in_use(db, key)),
        destination_limit=destination_limit(plan),
        created_at=key.created_at,
        badges=[Badge(**badge) for badge in badges_for(db, key)],
        custom_domains_available=config.CUSTOM_DOMAINS_ENABLED,
    )
