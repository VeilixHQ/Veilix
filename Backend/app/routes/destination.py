from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.limiter import limiter
from app.db.session import get_db
from app.schemas.destination import ConfirmDestinationRequest, ConfirmDestinationResponse
from app.services.destination_service import confirm_destination

router = APIRouter(tags=["Destination"])


@router.post("/destination/confirm", response_model=ConfirmDestinationResponse)
@limiter.limit("30/hour")
def confirm(request: Request, body: ConfirmDestinationRequest, db: Session = Depends(get_db)):
    activated = confirm_destination(db, body.token)
    return ConfirmDestinationResponse(status="confirmed", activated_aliases=activated)
