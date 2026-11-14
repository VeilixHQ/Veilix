import logging

from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.alias import Alias
from app.services.email_service import forward_email
from app.core.encryption import decrypt, is_encrypted
from app.core.mailgun import verify_signature, claim_token, release_token

logger = logging.getLogger("veilix.email")

router = APIRouter(tags=["Email"])

async def _read_payload(request: Request) -> dict:
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            data = await request.json()
        except ValueError:
            raise HTTPException(status_code=400, detail="Requete invalide")
        if not isinstance(data, dict):
            raise HTTPException(status_code=400, detail="Requete invalide")
        nested = data.get("signature")
        if isinstance(nested, dict):
            data = {**data, **nested}
        return data
    form = await request.form()
    return {field: value for field, value in form.items() if isinstance(value, str)}

@router.post("/email/inbound")
async def inbound(request: Request, db: Session = Depends(get_db)):
    data = await _read_payload(request)

    timestamp = str(data.get("timestamp") or "")
    token     = str(data.get("token") or "")
    signature = str(data.get("signature") or "")

    if not verify_signature(timestamp, token, signature):
        logger.warning("Signature Mailgun invalide.")
        raise HTTPException(status_code=403, detail="Signature invalide")
    if not claim_token(token):
        logger.warning("Webhook Mailgun rejoue.")
        raise HTTPException(status_code=403, detail="Signature invalide")

    recipient = str(data.get("recipient") or "").lower().strip()
    sender    = str(data.get("sender") or "")
    subject   = str(data.get("subject") or "(sans objet)")
    body      = str(data.get("body-plain") or data.get("body") or "")

    if not recipient:
        return {"status": "ignored"}

    alias = db.query(Alias).filter(Alias.alias_email == recipient).first()
    if not alias or alias.status != "active":
        return {"status": "ignored"}

    try:
        stored = alias.destination_email
        real_destination = decrypt(stored, alias.key_version) if is_encrypted(stored) else stored
        forward_email(real_destination, sender, subject, body)
    except Exception as exc:
        release_token(token)
        logger.error("Echec du transfert : %s", type(exc).__name__)
        raise HTTPException(status_code=502, detail="Transfert impossible")

    return {"status": "forwarded"}