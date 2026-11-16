from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.core import rate_limit
from app.core.limiter import client_ip
from app.core.rate_limit import ip_limit
from app.core.security import KEY_ID_HEADER, KEY_ID_LENGTH
from app.db.session import get_db
from app.models.key import Key
from app.schemas.beta import BetaKeyStatus, BetaPublicStatus, FeedbackRequest, PhaseStatus, SignupRequest
from app.services import beta_service
from app.services.key_service import get_key_by_id

router = APIRouter(tags=["Beta"])


def get_existing_key(
    x_veilix_key_id: str = Header(..., alias=KEY_ID_HEADER),
    db: Session = Depends(get_db),
) -> Key:
    if len(x_veilix_key_id) != KEY_ID_LENGTH or not all(c in "0123456789abcdef" for c in x_veilix_key_id):
        raise HTTPException(status_code=401, detail="Unauthorized")
    key = get_key_by_id(db, x_veilix_key_id)
    if not key:
        raise HTTPException(status_code=401, detail="Clé inconnue")
    return key


def get_beta_key(key: Key = Depends(get_existing_key)) -> Key:
    if key.status == "active" or (key.status == "suspended" and key.suspension_reason == "feedback"):
        return key
    if key.status == "pending_payment":
        raise HTTPException(status_code=402, detail="PAYMENT_REQUIRED")
    raise HTTPException(status_code=403, detail="Clé suspendue")


@router.get("/beta/status", response_model=BetaPublicStatus, dependencies=[Depends(ip_limit("beta-status", 120, 60))])
def public_status():
    now = beta_service.now_utc()
    second = beta_service.wave2_opens_at()
    public_seats = beta_service.capacity("public", now)
    wave = None
    if public_seats is not None:
        wave = 2 if public_seats > beta_service.config.BETA_PUBLIC_WAVE1_SEATS else 1
    def dates(phase: str) -> dict:
        return {
            "opens_at": beta_service.phase_opens_at(phase),
            "signups_close_at": beta_service.signups_close_at(phase),
            "ends_at": beta_service.phase_ends_at(phase),
        }

    return BetaPublicStatus(
        private=PhaseStatus(open=beta_service.capacity("private", now) is not None, **dates("private")),
        public=PhaseStatus(open=public_seats is not None, wave=wave, wave2_opens_at=second, **dates("public")),
        launch_at=beta_service.config.LAUNCH_AT,
    )


@router.post("/beta/signup", status_code=202, dependencies=[Depends(ip_limit("beta-signup", 5, 3600))])
def signup(body: SignupRequest, request: Request, db: Session = Depends(get_db)):
    if body.website:
        return {"status": "ok"}
    limits = beta_service.config
    rate_limit.hit("beta-signup-day", client_ip(request), limits.BETA_SIGNUP_PER_IP_PER_DAY, 24 * 3600, "Trop de requêtes. Réessayez plus tard.")
    rate_limit.hit("beta-signup-global", "all", limits.BETA_SIGNUP_GLOBAL_PER_HOUR, 3600, "Trop de demandes en ce moment. Réessayez dans une heure.")
    phase = "private" if body.invitation else "public"
    beta_service.signup(db, phase, str(body.email), body.consent, body.invitation)
    return {"status": "ok"}


@router.get("/beta/me", response_model=BetaKeyStatus)
def my_status(key: Key = Depends(get_beta_key), db: Session = Depends(get_db)):
    return BetaKeyStatus(**beta_service.status_for(db, key))


@router.post("/beta/feedback", response_model=BetaKeyStatus, dependencies=[Depends(ip_limit("beta-feedback", 20, 3600))])
def feedback(body: FeedbackRequest, key: Key = Depends(get_beta_key), db: Session = Depends(get_db)):
    return BetaKeyStatus(**beta_service.submit_feedback(db, key, body.model_dump()))


@router.delete("/key/me", status_code=204, dependencies=[Depends(ip_limit("delete-account", 10, 3600))])
def delete_me(key: Key = Depends(get_existing_key), db: Session = Depends(get_db)):
    beta_service.delete_account(db, key)
    return Response(status_code=204)
