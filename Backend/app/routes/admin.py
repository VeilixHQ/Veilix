import json

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core import config
from app.core.encryption import decrypt
from app.core.limiter import client_ip
from app.core.rate_limit import ip_limit
from app.db.session import get_db
from app.models.access_code import AccessCode
from app.models.alias import Alias
from app.models.beta import BetaFeedback, BetaSignup
from app.models.key import Key
from app.plans import ADMIN_KEYS
from app.routes.beta import get_existing_key
from app.services import beta_service, launch_service
from app.services.access_service import revoke_code

router = APIRouter(prefix="/admin/beta", tags=["Admin"], dependencies=[Depends(ip_limit("admin", 120, 60))])


def require_admin(request: Request, key: Key = Depends(get_existing_key)) -> Key:
    allowed_ip = not config.ADMIN_ALLOWED_IPS or client_ip(request) in config.ADMIN_ALLOWED_IPS
    if not allowed_ip or key.status != "active" or not (key.is_admin or key.key_id in ADMIN_KEYS):
        raise HTTPException(status_code=404, detail="Not Found")
    return key


def _iso(value):
    return value.isoformat() if value else None


@router.get("")
def overview(admin: Key = Depends(require_admin), db: Session = Depends(get_db)):
    now = beta_service.now_utc()
    phases = {}
    for phase in beta_service.PHASES:
        signups = db.query(BetaSignup).filter(BetaSignup.phase == phase)
        phases[phase] = {
            "open": beta_service.capacity(phase, now) is not None,
            "capacity": beta_service.capacity(phase, now),
            "seats_taken": beta_service.seats_taken(db, phase, now),
            "waiting": signups.filter(BetaSignup.status == "waiting").count(),
            "invited": signups.filter(BetaSignup.status == "invited").count(),
            "registered": signups.filter(BetaSignup.status == "registered").count(),
            "opens_at": _iso(beta_service.phase_opens_at(phase)),
            "signups_close_at": _iso(beta_service.signups_close_at(phase)),
            "ends_at": _iso(beta_service.phase_ends_at(phase)),
        }
    phases["public"]["wave2_opens_at"] = _iso(beta_service.wave2_opens_at())
    phases["public"]["wave2_hold"] = config.BETA_PUBLIC_WAVE2_HOLD

    testers = []
    rows = db.query(AccessCode, Key).outerjoin(Key, Key.id == AccessCode.key_id).order_by(AccessCode.id).all()
    for access, key in rows:
        signup = db.query(BetaSignup).filter(BetaSignup.id == access.signup_id).first() if access.signup_id else None
        contact = None
        if key and key.contact_email:
            contact = decrypt(key.contact_email, 2)
        elif signup:
            contact = decrypt(signup.email, 2)
        testers.append({
            "code_id": access.id,
            "phase": access.phase,
            "code_status": access.status,
            "created_at": _iso(access.created_at),
            "expires_at": _iso(access.expires_at),
            "used_at": _iso(access.used_at),
            "contact": contact,
            "key_id": key.id if key else None,
            "key_status": key.status if key else None,
            "suspension_reason": key.suspension_reason if key else None,
            "feedback_due_at": _iso(key.feedback_due_at) if key else None,
            "reminded_at": _iso(key.feedback_reminded_at) if key else None,
            "feedback_count": db.query(BetaFeedback).filter(BetaFeedback.key_id == key.id).count() if key else 0,
            "aliases": db.query(Alias).filter(Alias.key_id == key.id).count() if key else 0,
        })

    registered = [t for t in testers if t["key_id"]]
    metrics = {
        "launch_waitlist": launch_service.count(db),
        "testers": len(registered),
        "with_alias": sum(1 for t in registered if t["aliases"] > 0),
        "aliases": sum(t["aliases"] for t in registered),
        "feedback": db.query(BetaFeedback).count(),
        "suspended": sum(1 for t in registered if t["key_status"] == "suspended"),
    }
    return {"phases": phases, "metrics": metrics, "testers": testers}


@router.get("/feedback")
def feedback(admin: Key = Depends(require_admin), db: Session = Depends(get_db)):
    rows = db.query(BetaFeedback).order_by(BetaFeedback.submitted_at.desc()).limit(500).all()
    return [
        {
            "id": row.id,
            "key_id": row.key_id,
            "submitted_at": _iso(row.submitted_at),
            "is_final": row.is_final,
            "answers": json.loads(decrypt(row.answers, 2)),
        }
        for row in rows
    ]


@router.post("/codes/{code_id}/revoke")
def revoke(code_id: int, admin: Key = Depends(require_admin), db: Session = Depends(get_db)):
    access = revoke_code(db, code_id=code_id)
    if not access:
        raise HTTPException(status_code=404, detail="Code introuvable")
    beta_service.process_queue(db, access.phase)
    return {"status": "revoked"}


@router.post("/keys/{key_id}/reactivate")
def reactivate(key_id: int, admin: Key = Depends(require_admin), db: Session = Depends(get_db)):
    key = db.query(Key).filter(Key.id == key_id).first()
    if not key or key.status != "suspended":
        raise HTTPException(status_code=404, detail="Clé introuvable ou déjà active")
    key.status = "active"
    key.suspension_reason = None
    key.feedback_reminded_at = None
    if key.feedback_due_at and key.feedback_due_at < beta_service.now_utc():
        key.feedback_due_at = beta_service.now_utc() + beta_service.FEEDBACK_PERIOD["private"]
    db.commit()
    return {"status": "active"}


@router.post("/tick")
def run_tick(admin: Key = Depends(require_admin), db: Session = Depends(get_db)):
    return beta_service.tick(db)
