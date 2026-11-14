# Backend/app/routes/key.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.plans import get_effective_plan
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
        # exists=False (et non une erreur 401) : la page /access s'appuie sur ce champ
        return VerifyKeyResponse(exists=False)

    # Plan EFFECTIF : "admin" (flag en base ou ADMIN_KEY_IDS), sinon "pro" / "pack"
    effective = "admin" if key.is_admin else get_effective_plan(key.key_id, key.plan)
    return VerifyKeyResponse(exists=True, plan=effective, status=key.status)