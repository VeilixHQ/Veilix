from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.limiter import limiter
from app.db.session import get_db
from app.plans import get_effective_plan
from app.schemas.key import RegisterKeyRequest, VerifyKeyRequest, VerifyKeyResponse, KeyResponse
from app.services.key_service import create_key, get_key_by_id

router = APIRouter(tags=["Key"])


@router.post("/key/register", response_model=KeyResponse)
@limiter.limit("20/hour")
def register(request: Request, body: RegisterKeyRequest, db: Session = Depends(get_db)):
    key = create_key(db, body.key_id, body.recovery_email)
    return KeyResponse(key_id=body.key_id, plan=key.plan, status=key.status, credits=key.credits)


@router.post("/key/verify", response_model=VerifyKeyResponse)
@limiter.limit("120/minute")
def verify(request: Request, body: VerifyKeyRequest, db: Session = Depends(get_db)):
    key = get_key_by_id(db, body.key_id)
    if not key:
        return VerifyKeyResponse(exists=False)

    effective = "admin" if key.is_admin else get_effective_plan(key.key_id, key.plan)
    return VerifyKeyResponse(exists=True, plan=effective, status=key.status)