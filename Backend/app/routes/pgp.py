from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.rate_limit import enforce_daily_limit
from app.core.security import get_current_key, get_current_key_id_str
from app.db.session import get_db
from app.models.key import Key
from app.services import pgp_service

router = APIRouter(tags=["PGP"])


class PgpKeyRequest(BaseModel):
    public_key: str = Field(min_length=50, max_length=pgp_service.MAX_PUBLIC_KEY_BYTES)


class PgpToggleRequest(BaseModel):
    enabled: bool


class PgpResponse(BaseModel):
    configured: bool
    enabled: bool
    fingerprint: Optional[str] = None
    user_ids: list[str] = []
    expires_at: Optional[datetime] = None


@router.get("/pgp", response_model=PgpResponse)
def status(key: Key = Depends(get_current_key)):
    return pgp_service.describe(key)


@router.put("/pgp", response_model=PgpResponse)
def upload(body: PgpKeyRequest, key: Key = Depends(get_current_key), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    return pgp_service.describe(pgp_service.set_public_key(db, key, body.public_key))


@router.patch("/pgp", response_model=PgpResponse)
def toggle(body: PgpToggleRequest, key: Key = Depends(get_current_key), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    return pgp_service.describe(pgp_service.set_enabled(db, key, body.enabled))


@router.delete("/pgp", response_model=PgpResponse)
def remove(key: Key = Depends(get_current_key), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    return pgp_service.describe(pgp_service.remove_public_key(db, key))
