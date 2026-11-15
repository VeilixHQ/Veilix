import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from starlette.concurrency import run_in_threadpool
from starlette.datastructures import UploadFile
from sqlalchemy.orm import Session

from app.core.mailgun import claim_token, release_token, verify_signature
from app.db.session import get_db
from app.services import inbound_service, sender_auth
from app.services.inbound_service import InboundMessage

logger = logging.getLogger("veilix.email")

router = APIRouter(tags=["Email"])

MAX_BODY_BYTES = 40 * 1024 * 1024
MAX_FIELD_BYTES = 10 * 1024 * 1024
MAX_FORM_FILES = 50


async def _read_payload(request: Request) -> tuple[dict, list[UploadFile]]:
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
        return data, []
    form = await request.form(max_files=MAX_FORM_FILES, max_part_size=MAX_FIELD_BYTES)
    fields = {name: value for name, value in form.multi_items() if isinstance(value, str)}
    uploads = [value for _, value in form.multi_items() if isinstance(value, UploadFile)]
    return fields, uploads


async def _read_attachments(uploads: list[UploadFile]) -> list[tuple[str, bytes, str]]:
    attachments = []
    for index, upload in enumerate(uploads[:inbound_service.MAX_ATTACHMENTS], start=1):
        content = await upload.read()
        if content:
            attachments.append((upload.filename or f"piece-{index}", content, upload.content_type or "application/octet-stream"))
    return attachments


@router.post("/email/inbound")
async def inbound(request: Request, db: Session = Depends(get_db)):
    announced = request.headers.get("content-length", "")
    if announced.isdigit() and int(announced) > MAX_BODY_BYTES:
        raise HTTPException(status_code=413, detail="Message trop volumineux")

    data, uploads = await _read_payload(request)

    timestamp = str(data.get("timestamp") or "")
    token = str(data.get("token") or "")
    signature = str(data.get("signature") or "")

    if not verify_signature(timestamp, token, signature):
        logger.warning("Signature Mailgun invalide.")
        raise HTTPException(status_code=403, detail="Signature invalide")
    if not claim_token(token):
        logger.warning("Webhook Mailgun rejoue.")
        raise HTTPException(status_code=403, detail="Signature invalide")

    message = InboundMessage(
        recipient=str(data.get("recipient") or ""),
        from_header=str(data.get("from") or ""),
        envelope_sender=str(data.get("sender") or ""),
        subject=str(data.get("subject") or ""),
        text=str(data.get("body-plain") or data.get("body") or ""),
        html=str(data.get("body-html") or ""),
        attachments=await _read_attachments(uploads),
        headers=sender_auth.parse_headers(data.get("message-headers")),
    )

    try:
        return await run_in_threadpool(inbound_service.process, db, message)
    except Exception as exc:
        release_token(token)
        logger.error("Echec du traitement du message : %s", type(exc).__name__)
        raise HTTPException(status_code=502, detail="Transfert impossible")
