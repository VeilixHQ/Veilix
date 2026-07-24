from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.alias import Alias
from app.services.email_service import forward_email
from app.core.encryption import decrypt

router = APIRouter(tags=["Email"])

@router.post("/email/inbound")
async def inbound(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    recipient = data.get("recipient", "").lower().strip()
    sender    = data.get("sender", "")
    subject   = data.get("subject", "(sans objet)")
    body      = data.get("body-plain") or data.get("body", "")

    if not recipient:
        return {"status": "error", "detail": "recipient manquant"}

    alias = db.query(Alias).filter(Alias.alias_email == recipient).first()
    if not alias:
        return {"status": "ignored", "detail": "alias inconnu"}
    if alias.status != "active":
        return {"status": "ignored", "detail": "alias desactive"}

    try:
        real_destination = decrypt(alias.destination_email, alias.key_version)
        forward_email(real_destination, sender, subject, body)
        return {"status": "forwarded"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}