from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.rate_limit import ip_limit
from app.db.session import get_db
from app.services import pack_service

router = APIRouter(tags=["Pack de lancement"])


class PackAvailability(BaseModel):
    total: int
    taken: int
    remaining: int


@router.get("/pack/availability", response_model=PackAvailability, dependencies=[Depends(ip_limit("pack-availability", 120, 60))])
def availability(db: Session = Depends(get_db)):
    return PackAvailability(**pack_service.availability(db))
