from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.rate_limit import enforce_daily_limit
from app.core.security import get_current_key, get_current_key_id_str, require_key_header
from app.db.session import get_db
from app.models.key import Key
from app.services import api_token_service, digest_service

router = APIRouter(tags=["Preferences"])


class PreferencesRequest(BaseModel):
    leak_alerts: Optional[bool] = None
    weekly_digest: Optional[bool] = None


class PreferencesResponse(BaseModel):
    leak_alerts: bool
    weekly_digest: bool
    digest_sent_at: Optional[datetime] = None


class CreateTokenRequest(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class TokenResponse(BaseModel):
    id: int
    name: str
    prefix: str
    created_at: datetime


class CreatedTokenResponse(TokenResponse):
    token: str


def _preferences(key: Key) -> PreferencesResponse:
    return PreferencesResponse(leak_alerts=key.leak_alerts, weekly_digest=key.weekly_digest, digest_sent_at=key.digest_sent_at)


@router.get("/preferences", response_model=PreferencesResponse)
def read(key: Key = Depends(get_current_key)):
    return _preferences(key)


@router.patch("/preferences", response_model=PreferencesResponse)
def update(body: PreferencesRequest, key: Key = Depends(get_current_key), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    if body.leak_alerts is not None:
        key.leak_alerts = body.leak_alerts
    if body.weekly_digest is not None and body.weekly_digest != key.weekly_digest:
        key.weekly_digest = body.weekly_digest
        if body.weekly_digest:
            digest_service.reset_baseline(db, key)
    db.commit()
    db.refresh(key)
    return _preferences(key)


@router.get("/api-tokens", response_model=list[TokenResponse], dependencies=[Depends(require_key_header)])
def list_tokens(key: Key = Depends(get_current_key), db: Session = Depends(get_db)):
    return api_token_service.list_tokens(db, key)


@router.post("/api-tokens", response_model=CreatedTokenResponse, dependencies=[Depends(require_key_header)])
def create_token(body: CreateTokenRequest, key: Key = Depends(get_current_key), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    record, token = api_token_service.create_token(db, key, body.name)
    return CreatedTokenResponse(id=record.id, name=record.name, prefix=record.prefix, created_at=record.created_at, token=token)


@router.delete("/api-tokens/{token_id}", dependencies=[Depends(require_key_header)])
def revoke_token(token_id: int, key: Key = Depends(get_current_key), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    api_token_service.revoke_token(db, key, token_id)
    return {"status": "deleted"}
