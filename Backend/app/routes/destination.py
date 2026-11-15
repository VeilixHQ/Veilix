from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.rate_limit import ip_limit
from app.db.session import get_db
from app.schemas.destination import ConfirmDestinationRequest, ConfirmDestinationResponse
from app.services.destination_service import confirm_destination

router = APIRouter(tags=["Destination"])


@router.post("/destination/confirm", response_model=ConfirmDestinationResponse, dependencies=[Depends(ip_limit("confirm", 30, 3600))])
def confirm(body: ConfirmDestinationRequest, db: Session = Depends(get_db)):
    activated = confirm_destination(db, body.token)
    return ConfirmDestinationResponse(status="confirmed", activated_aliases=activated)
