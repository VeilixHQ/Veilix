from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_key_id, get_current_key_id_str
from app.core.rate_limit import enforce_daily_limit
from app.schemas.alias import CreateAliasRequest, AliasResponse
from app.services.alias_service import create_alias, list_aliases, disable_alias, enable_alias, delete_alias

router = APIRouter(tags=["Alias"])

@router.post("/alias", response_model=AliasResponse)
def create(body: CreateAliasRequest, key_id: int = Depends(get_current_key_id), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    return create_alias(db, key_id, body.destination_email, body.label)

@router.get("/alias", response_model=list[AliasResponse])
def list_all(key_id: int = Depends(get_current_key_id), db: Session = Depends(get_db)):
    return list_aliases(db, key_id)

@router.patch("/alias/{alias_id}/disable", response_model=AliasResponse)
def disable(alias_id: int, key_id: int = Depends(get_current_key_id), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    return disable_alias(db, alias_id, key_id)

@router.patch("/alias/{alias_id}/enable", response_model=AliasResponse)
def enable(alias_id: int, key_id: int = Depends(get_current_key_id), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    return enable_alias(db, alias_id, key_id)

@router.delete("/alias/{alias_id}")
def remove(alias_id: int, key_id: int = Depends(get_current_key_id), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    delete_alias(db, alias_id, key_id)
    return {"status": "deleted"}