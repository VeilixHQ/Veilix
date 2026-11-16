import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from starlette.datastructures import FormData, UploadFile
from sqlalchemy.orm import Session

from app.core import config, mailgun, rate_limit
from app.core.limiter import client_ip
from app.db.session import get_db
from app.services import delivery_service, inbound_service, sender_auth
from app.services.inbound_service import InboundMessage

logger = logging.getLogger("veilix.email")

router = APIRouter(tags=["Email"])

MAX_BODY_BYTES = 40 * 1024 * 1024
MAX_EVENT_BYTES = 1024 * 1024
MAX_FIELD_BYTES = 10 * 1024 * 1024
MAX_FORM_FILES = 50
BAD_SIGNATURE_SCOPE = "webhook-bad-signature"
BAD_SIGNATURE_WINDOW = 3600
BUSY_RETRY_SECONDS = 120
DEFERRED_RETRY_SECONDS = 600


def _capped(request: Request, limit: int) -> Request:
    received = 0

    async def receive():
        nonlocal received
        message = await request.receive()
        if message["type"] == "http.request":
            received += len(message.get("body", b""))
            if received > limit:
                raise HTTPException(status_code=413, detail="Message trop volumineux")
        return message

    return Request(request.scope, receive)


async def _read_payload(request: Request, limit: int) -> tuple[dict, list[UploadFile], FormData | None]:
    announced = request.headers.get("content-length", "")
    if announced.isdigit() and int(announced) > limit:
        raise HTTPException(status_code=413, detail="Message trop volumineux")
    capped = _capped(request, limit)
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            data = await capped.json()
        except ValueError:
            raise HTTPException(status_code=400, detail="Requete invalide")
        if not isinstance(data, dict):
            raise HTTPException(status_code=400, detail="Requete invalide")
        nested = data.get("signature")
        if isinstance(nested, dict):
            data = {**data, **nested}
        return data, [], None
    form = await capped.form(max_files=MAX_FORM_FILES, max_part_size=MAX_FIELD_BYTES)
    fields = {name: value for name, value in form.multi_items() if isinstance(value, str)}
    uploads = [value for _, value in form.multi_items() if isinstance(value, UploadFile)]
    return fields, uploads, form


async def _read_attachments(uploads: list[UploadFile]) -> list[tuple[str, bytes, str]]:
    attachments = []
    for index, upload in enumerate(uploads[:inbound_service.MAX_ATTACHMENTS], start=1):
        content = await upload.read()
        if content:
            attachments.append((upload.filename or f"piece-{index}", content, upload.content_type or "application/octet-stream"))
    return attachments


async def _refuse_flooders(request: Request) -> str:
    address = client_ip(request)
    limit = config.WEBHOOK_BAD_SIGNATURES_PER_HOUR
    if await run_in_threadpool(rate_limit.blocked, BAD_SIGNATURE_SCOPE, address, limit, BAD_SIGNATURE_WINDOW):
        raise HTTPException(status_code=429, detail="Trop de requêtes. Réessayez plus tard.")
    return address


async def _authenticate(data: dict, address: str) -> str:
    timestamp = str(data.get("timestamp") or "")
    token = str(data.get("token") or "")
    signature = str(data.get("signature") or "")
    if not mailgun.verify_signature(timestamp, token, signature):
        await run_in_threadpool(rate_limit.allow, BAD_SIGNATURE_SCOPE, address, config.WEBHOOK_BAD_SIGNATURES_PER_HOUR, BAD_SIGNATURE_WINDOW)
        logger.warning("Signature Mailgun invalide.")
        raise HTTPException(status_code=403, detail="Signature invalide")
    return token


def _process_once(db: Session, message: InboundMessage) -> dict:
    key = message.dedupe_key
    if key:
        state = mailgun.claim_message(key)
        if state == mailgun.DONE:
            return {"status": "duplicate"}
        if state == mailgun.BUSY:
            raise inbound_service.Deferred()
    try:
        result = inbound_service.process(db, message)
    except inbound_service.Rejected:
        if key:
            mailgun.complete_message(key, "rejected")
        raise
    except BaseException:
        if key:
            mailgun.release_message(key)
        raise
    if key:
        mailgun.complete_message(key, result["status"])
    return result


@router.post("/email/inbound")
async def inbound(request: Request, db: Session = Depends(get_db)):
    address = await _refuse_flooders(request)
    data, uploads, form = await _read_payload(request, MAX_BODY_BYTES)
    try:
        token = await _authenticate(data, address)
        if not await run_in_threadpool(mailgun.claim_token, token):
            if await run_in_threadpool(mailgun.token_completed, token):
                logger.warning("Webhook Mailgun rejoue.")
                raise HTTPException(status_code=403, detail="Signature invalide")
            raise HTTPException(status_code=503, detail="Traitement en cours", headers={"Retry-After": str(BUSY_RETRY_SECONDS)})

        headers = sender_auth.parse_headers(data.get("message-headers"))
        message = InboundMessage(
            recipient=str(data.get("recipient") or ""),
            from_header=str(data.get("from") or ""),
            envelope_sender=str(data.get("sender") or ""),
            subject=str(data.get("subject") or ""),
            text=str(data.get("body-plain") or data.get("body") or ""),
            html=str(data.get("body-html") or ""),
            attachments=await _read_attachments(uploads),
            headers=headers,
        )
        message.dedupe_key = mailgun.message_key(
            sender_auth.message_id(headers) or str(data.get("Message-Id") or ""),
            inbound_service.normalize_address(message.recipient),
            inbound_service.sender_of(message),
        )

        try:
            result = await run_in_threadpool(_process_once, db, message)
        except inbound_service.Deferred:
            await run_in_threadpool(mailgun.release_token, token)
            logger.info("Message différé : limite de débit atteinte ou traitement concurrent.")
            raise HTTPException(status_code=503, detail="Message différé", headers={"Retry-After": str(DEFERRED_RETRY_SECONDS)})
        except inbound_service.Rejected:
            await run_in_threadpool(mailgun.complete_token, token)
            logger.error("Message abandonné : refus définitif du service d'envoi.")
            return JSONResponse(status_code=406, content={"status": "rejected"})
        except Exception as exc:
            await run_in_threadpool(mailgun.release_token, token)
            logger.error("Echec du traitement du message : %s", type(exc).__name__)
            raise HTTPException(status_code=502, detail="Transfert impossible")
        await run_in_threadpool(mailgun.complete_token, token)
        return result
    finally:
        if form is not None:
            await form.close()


@router.post("/email/events")
async def events(request: Request, db: Session = Depends(get_db)):
    address = await _refuse_flooders(request)
    data, _, form = await _read_payload(request, MAX_EVENT_BYTES)
    try:
        token = await _authenticate(data, address)
        event = data.get("event-data")
        if not isinstance(event, dict):
            raise HTTPException(status_code=400, detail="Requete invalide")
        if not await run_in_threadpool(mailgun.claim_token, token):
            if await run_in_threadpool(mailgun.token_completed, token):
                return {"status": "duplicate"}
            raise HTTPException(status_code=503, detail="Traitement en cours", headers={"Retry-After": str(BUSY_RETRY_SECONDS)})
        try:
            result = await run_in_threadpool(delivery_service.handle_event, db, event)
        except Exception as exc:
            await run_in_threadpool(mailgun.release_token, token)
            logger.error("Echec du traitement de l'événement : %s", type(exc).__name__)
            raise HTTPException(status_code=502, detail="Traitement impossible")
        await run_in_threadpool(mailgun.complete_token, token)
        return result
    finally:
        if form is not None:
            await form.close()
