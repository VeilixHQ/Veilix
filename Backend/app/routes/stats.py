import hmac

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core import config
from app.core.rate_limit import ip_limit
from app.db.session import get_db
from app.services import acquisition_service

router = APIRouter(prefix="/stats", tags=["Statistiques"], dependencies=[Depends(ip_limit("stats", 60, 60))])


def require_stats_token(authorization: str = Header(default="")) -> None:
    expected = config.STATS_API_TOKEN
    provided = authorization.removeprefix("Bearer ").strip()
    if not expected or not hmac.compare_digest(provided.encode(), expected.encode()):
        raise HTTPException(status_code=404, detail="Not Found")


@router.get("/acquisition", dependencies=[Depends(require_stats_token)])
def acquisition(days: int = 90, db: Session = Depends(get_db)) -> dict:
    return acquisition_service.summary(db, days)
