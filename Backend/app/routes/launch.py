from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.core import config, rate_limit
from app.core.limiter import client_ip
from app.core.rate_limit import ip_limit
from app.db.session import get_db
from app.services import launch_service

router = APIRouter(tags=["Lancement"])


class LaunchSignupRequest(BaseModel):
    email: EmailStr
    consent: bool
    website: Optional[str] = Field(default=None, max_length=200)


class LaunchLeaveRequest(BaseModel):
    token: str = Field(min_length=3, max_length=100)


@router.post("/launch/signup", status_code=202, dependencies=[Depends(ip_limit("launch-signup", 5, 3600))])
def signup(body: LaunchSignupRequest, request: Request, db: Session = Depends(get_db)):
    if body.website:
        return {"status": "ok"}
    rate_limit.hit("launch-signup-day", client_ip(request), config.BETA_SIGNUP_PER_IP_PER_DAY, 24 * 3600, "Trop de requêtes. Réessayez plus tard.")
    rate_limit.hit("launch-signup-global", "all", config.BETA_SIGNUP_GLOBAL_PER_HOUR, 3600, "Trop de demandes en ce moment. Réessayez dans une heure.")
    launch_service.signup(db, str(body.email), body.consent)
    return {"status": "ok"}


@router.post("/launch/leave", dependencies=[Depends(ip_limit("launch-leave", 20, 3600))])
def leave(body: LaunchLeaveRequest, db: Session = Depends(get_db)):
    if not launch_service.leave(db, body.token):
        raise HTTPException(status_code=404, detail="Lien de désinscription invalide ou déjà utilisé.")
    return {"status": "ok"}
