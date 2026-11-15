from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.limiter import limiter
from app.core.security import get_current_key
from app.db.session import get_db
from app.models.key import Key
from app.plans import alias_quota, get_effective_plan
from app.schemas.key import RegisterKeyRequest, VerifyKeyRequest, VerifyKeyResponse, KeyResponse, KeyAccountResponse
from app.services.alias_service import count_aliases
from app.services.key_service import create_key, get_key_by_id

router = APIRouter(tags=["Key"])


@router.post("/key/register", response_model=KeyResponse)
@limiter.limit("20/hour")
def register(request: Request, body: RegisterKeyRequest, db: Session = Depends(get_db)):
    key = create_key(db, body.key_id, body.recovery_email)
    return KeyResponse(key_id=body.key_id, plan=key.plan, status=key.status, credits=key.credits, created_at=key.created_at)


@router.post("/key/verify", response_model=VerifyKeyResponse)
@limiter.limit("120/minute")
def verify(request: Request, body: VerifyKeyRequest, db: Session = Depends(get_db)):
    key = get_key_by_id(db, body.key_id)
    if not key:
        return VerifyKeyResponse(exists=False)

    effective = get_effective_plan(key.key_id, key.plan, key.is_admin)
    return VerifyKeyResponse(exists=True, plan=effective, status=key.status)


@router.get("/key/me", response_model=KeyAccountResponse)
@limiter.limit("120/minute")
def me(request: Request, key: Key = Depends(get_current_key), db: Session = Depends(get_db)):
    plan = get_effective_plan(key.key_id, key.plan, key.is_admin)
    return KeyAccountResponse(
        plan=plan,
        status=key.status,
        credits=key.credits,
        aliases_used=count_aliases(db, key),
        alias_quota=alias_quota(plan),
        created_at=key.created_at,
    )
