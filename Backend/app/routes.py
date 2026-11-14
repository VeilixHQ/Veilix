from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, EmailStr
from typing import Optional
from database import get_db
from models import User, Alias, Destination, DailyStat

router = APIRouter()

PLAN_LIMITS = {
    "pro": {"aliases": 100, "destinations": 3},
    "pack": {"aliases": None, "destinations": 10},  # None = illimité
    "inactive": {"aliases": 0, "destinations": 0}
}

# --- SCHÉMAS PYDANTIC ---
class VerifyKeyRequest(BaseModel):
    key_id: str

class NotificationUpdate(BaseModel):
    leak_alerts_enabled: bool
    weekly_digest_enabled: bool

class DestinationCreate(BaseModel):
    email: EmailStr

class AliasCreate(BaseModel):
    address: str


# --- AUTHENTIFICATION & SÉCURITÉ API ---
def get_current_user(
    request: Request,
    x_veilix_key_id: str = Header(..., alias="X-Veilix-Key-Id"),
    x_client_source: Optional[str] = Header(None, alias="X-Client-Source"),
    db: Session = Depends(get_db)
) -> User:
    user = db.query(User).filter(User.key_id == x_veilix_key_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Clé d'accès invalide")
    
    if user.plan == "inactive":
        raise HTTPException(status_code=403, detail="Abonnement inactif")

    # Cloisonnement API : l'accès externe est réservé au Pack de lancement
    if user.plan != "pack" and x_client_source != "veilix-web":
        raise HTTPException(
            status_code=403,
            detail="L'accès API programmatique est réservé au Pack de lancement."
        )

    return user


# --- ENDPOINTS ---
@router.post("/key/verify")
def verify_key(payload: VerifyKeyRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.key_id == payload.key_id).first()
    if not user:
        return {"exists": False}
    return {
        "exists": True,
        "plan": user.plan,
        "leak_alerts_enabled": user.leak_alerts_enabled if user.plan == "pack" else False,
        "weekly_digest_enabled": user.weekly_digest_enabled
    }


@router.get("/alias")
def list_aliases(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Alias).filter(Alias.user_id == user.id).order_by(Alias.created_at.desc()).all()


@router.post("/alias")
def create_alias(payload: AliasCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    max_aliases = PLAN_LIMITS[user.plan]["aliases"]
    if max_aliases is not None:
        active_count = db.query(Alias).filter(Alias.user_id == user.id, Alias.active == True).count()
        if active_count >= max_aliases:
            raise HTTPException(status_code=403, detail=f"Limite de {max_aliases} alias actifs atteinte pour votre plan.")

    new_alias = Alias(user_id=user.id, address=payload.address.lower())
    db.add(new_alias)
    db.commit()
    db.refresh(new_alias)
    return new_alias


@router.post("/destinations")
def add_destination(payload: DestinationCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    max_dest = PLAN_LIMITS[user.plan]["destinations"]
    current_dest_count = db.query(Destination).filter(Destination.user_id == user.id).count()

    if current_dest_count >= max_dest:
        raise HTTPException(
            status_code=403,
            detail=f"Limite atteinte : {max_dest} boîtes de destination maximum pour votre formule."
        )

    dest = Destination(user_id=user.id, email=payload.email.lower())
    db.add(dest)
    db.commit()
    db.refresh(dest)
    return dest


@router.patch("/user/notifications")
def update_notifications(payload: NotificationUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.leak_alerts_enabled = payload.leak_alerts_enabled if user.plan == "pack" else False
    user.weekly_digest_enabled = payload.weekly_digest_enabled
    db.commit()
    return {
        "leak_alerts_enabled": user.leak_alerts_enabled,
        "weekly_digest_enabled": user.weekly_digest_enabled
    }


@router.get("/stats/overview")
def get_stats_overview(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    total_blocked = db.query(func.sum(Alias.blocked_count)).filter(Alias.user_id == user.id).scalar() or 0
    total_forwarded = db.query(func.sum(Alias.forwarded_count)).filter(Alias.user_id == user.id).scalar() or 0

    history = (
        db.query(DailyStat)
        .filter(DailyStat.user_id == user.id)
        .order_by(DailyStat.date.desc())
        .limit(7)
        .all()
    )

    return {
        "total_blocked": total_blocked,
        "total_forwarded": total_forwarded,
        "history": [
            {
                "date": stat.date.isoformat(),
                "blocked_count": stat.blocked_count,
                "forwarded_count": stat.forwarded_count
            }
            for stat in reversed(history)
        ]
    }