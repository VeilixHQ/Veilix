from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_key_id, get_current_key_id_str
from app.core.rate_limit import enforce_daily_limit
from app.core.encryption import decrypt, is_encrypted
from app.models.alias import Alias
from app.schemas.alias import CreateAliasRequest, AliasResponse
from app.services.alias_service import create_alias, get_alias, list_aliases, disable_alias, enable_alias, delete_alias
from app.services.destination_service import request_confirmation

router = APIRouter(tags=["Alias"])

def _destination_of(alias: Alias) -> str:
    stored = alias.destination_email
    return decrypt(stored, alias.key_version) if stored and is_encrypted(stored) else stored

def _to_response(alias: Alias, confirmation_sent: bool | None = None) -> AliasResponse:
    return AliasResponse(
        id=alias.id,
        alias_email=alias.alias_email,
        destination_email=_destination_of(alias),
        label=alias.label,
        status=alias.status,
        confirmation_sent=confirmation_sent,
    )

def _send_confirmation_if_pending(db: Session, key_id: int, alias: Alias) -> bool | None:
    if alias.status != "pending":
        return None
    try:
        request_confirmation(db, key_id, _destination_of(alias), alias.email_hmac)
    except HTTPException:
        return False
    return True

@router.post("/alias", response_model=AliasResponse)
def create(body: CreateAliasRequest, key_id: int = Depends(get_current_key_id), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    alias = create_alias(db, key_id, body.destination_email, body.label)
    confirmation_sent = _send_confirmation_if_pending(db, key_id, alias)
    return _to_response(alias, confirmation_sent)

@router.get("/alias", response_model=list[AliasResponse])
def list_all(key_id: int = Depends(get_current_key_id), db: Session = Depends(get_db)):
    return [_to_response(alias) for alias in list_aliases(db, key_id)]

@router.patch("/alias/{alias_id}/disable", response_model=AliasResponse)
def disable(alias_id: int, key_id: int = Depends(get_current_key_id), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    return _to_response(disable_alias(db, key_id, alias_id))

@router.patch("/alias/{alias_id}/enable", response_model=AliasResponse)
def enable(alias_id: int, key_id: int = Depends(get_current_key_id), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    alias = enable_alias(db, key_id, alias_id)
    confirmation_sent = _send_confirmation_if_pending(db, key_id, alias)
    return _to_response(alias, confirmation_sent)

@router.post("/alias/{alias_id}/resend-confirmation")
def resend_confirmation(alias_id: int, key_id: int = Depends(get_current_key_id), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    alias = get_alias(db, key_id, alias_id)
    if alias.status != "pending":
        raise HTTPException(status_code=400, detail="Cet alias n'est pas en attente de confirmation.")
    request_confirmation(db, key_id, _destination_of(alias), alias.email_hmac)
    return {"status": "sent"}

@router.delete("/alias/{alias_id}")
def remove(alias_id: int, key_id: int = Depends(get_current_key_id), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    delete_alias(db, key_id, alias_id)
    return {"status": "deleted"}