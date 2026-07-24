from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.key import RegisterKeyRequest, VerifyKeyRequest, VerifyKeyResponse, KeyResponse
from app.services.key_service import create_key, get_key_by_id

router = APIRouter(tags=["Key"])

@router.post("/key/register", response_model=KeyResponse)
def register(body: RegisterKeyRequest, db: Session = Depends(get_db)):
    return create_key(db, body.key_id, body.recovery_email)

@router.post("/key/verify", response_model=VerifyKeyResponse)
def verify(body: VerifyKeyRequest, db: Session = Depends(get_db)):
    key = get_key_by_id(db, body.key_id)
    if not key:
        return VerifyKeyResponse(exists=False)
    return VerifyKeyResponse(exists=True, plan=key.plan, status=key.status)