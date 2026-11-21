from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.rate_limit import enforce_daily_limit
from app.core.security import get_current_key, get_current_key_id_str
from app.db.session import get_db
from app.models.alias import Alias
from app.models.custom_domain import CustomDomain
from app.models.key import Key
from app.schemas.domain import AddDomainRequest, CatchAllRequest, DomainCheckResponse, DomainResponse
from app.services import domain_service

router = APIRouter(tags=["Domains"])


def _response(db: Session, domain: CustomDomain) -> dict:
    return {
        "id": domain.id,
        "domain": domain.domain,
        "verified": domain.verified_at is not None,
        "verified_at": domain.verified_at,
        "last_checked_at": domain.last_checked_at,
        "catch_all": bool(domain.catch_all),
        "catch_all_destination": domain_service.catch_all_destination(domain) if domain.catch_all else None,
        "aliases": db.query(Alias).filter(Alias.domain_id == domain.id).count(),
        "records": domain_service.required_records(domain),
    }


@router.get("/domains", response_model=list[DomainResponse])
def list_all(key: Key = Depends(get_current_key), db: Session = Depends(get_db)):
    return [_response(db, domain) for domain in domain_service.list_domains(db, key)]


@router.post("/domains", response_model=DomainResponse)
def add(body: AddDomainRequest, key: Key = Depends(get_current_key), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    return _response(db, domain_service.add_domain(db, key, body.domain))


@router.post("/domains/{domain_id}/verify", response_model=DomainCheckResponse)
def verify(domain_id: int, key: Key = Depends(get_current_key), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    domain, status = domain_service.verify_domain(db, key, domain_id)
    return {**_response(db, domain), **status}


@router.patch("/domains/{domain_id}/catch-all", response_model=DomainResponse)
def catch_all(domain_id: int, body: CatchAllRequest, key: Key = Depends(get_current_key), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    domain = domain_service.configure_catch_all(db, key, domain_id, body.enabled, body.destination_email)
    return _response(db, domain)


@router.delete("/domains/{domain_id}")
def remove(domain_id: int, key: Key = Depends(get_current_key), key_id_str: str = Depends(get_current_key_id_str), db: Session = Depends(get_db)):
    enforce_daily_limit(key_id_str)
    domain_service.remove_domain(db, key, domain_id)
    return {"status": "deleted"}
