import logging
from dataclasses import dataclass, field
from email.utils import formataddr, parseaddr

from sqlalchemy.orm import Session

from app.core.config import INTERNAL_DOMAINS
from app.core.encryption import decrypt, is_encrypted
from app.models.alias import Alias
from app.models.key import Key
from app.services import email_service, reply_service
from app.services.destination_service import is_verified

logger = logging.getLogger("veilix.inbound")

MAX_ATTACHMENTS = 20
MAX_ATTACHMENTS_BYTES = 20 * 1024 * 1024
OVERSIZE_NOTICE = "[Veilix] Pièces jointes non transférées (taille supérieure à 20 Mo)."
NO_SUBJECT = "(sans objet)"


@dataclass
class InboundMessage:
    recipient: str
    from_header: str
    envelope_sender: str
    subject: str
    text: str
    html: str
    attachments: list[tuple[str, bytes, str]] = field(default_factory=list)


def normalize_address(value: str) -> str:
    return parseaddr(value or "")[1].strip().lower()


def clean(value: str) -> str:
    return " ".join((value or "").split())


def is_internal(address: str) -> bool:
    return address.rpartition("@")[2] in INTERNAL_DOMAINS


def _sender(message: InboundMessage) -> str:
    return normalize_address(message.from_header) or normalize_address(message.envelope_sender)


def _deliverable(db: Session, alias: Alias | None) -> str | None:
    if not alias or alias.status != "active":
        return None
    key = db.get(Key, alias.key_id)
    if not key or key.status != "active":
        return None
    if not is_verified(db, alias.key_id, alias.email_hmac):
        return None
    stored = alias.destination_email
    destination = (decrypt(stored, alias.key_version) if is_encrypted(stored) else stored).strip().lower()
    if not destination or is_internal(destination):
        return None
    return destination


def _content(message: InboundMessage, data: dict) -> list:
    text, html = message.text, message.html
    files = [("attachment", item) for item in message.attachments[:MAX_ATTACHMENTS]]
    if sum(len(content) for _, content, _ in message.attachments[:MAX_ATTACHMENTS]) > MAX_ATTACHMENTS_BYTES:
        files = []
        text = f"{text}\n\n{OVERSIZE_NOTICE}"
        if html:
            html = f"{html}<p>{OVERSIZE_NOTICE}</p>"
    data["text"] = text
    if html:
        data["html"] = html
    data["o:tracking"] = "no"
    return files


def process(db: Session, message: InboundMessage) -> dict:
    recipient = normalize_address(message.recipient)
    sender = _sender(message)
    if not recipient or not sender:
        return {"status": "ignored"}
    token = reply_service.reply_token(recipient)
    if token is not None:
        return _reply(db, token, sender, message)
    return _forward(db, recipient, sender, message)


def _forward(db: Session, recipient: str, sender: str, message: InboundMessage) -> dict:
    alias = db.query(Alias).filter(Alias.alias_email == recipient).first()
    destination = _deliverable(db, alias)
    if not destination:
        return {"status": "ignored"}
    display_name = clean(parseaddr(message.from_header or "")[0]) or sender
    data = {
        "from": formataddr((f"{display_name} via Veilix", alias.alias_email)),
        "to": destination,
        "subject": clean(message.subject) or NO_SUBJECT,
        "h:Reply-To": reply_service.reply_address(db, alias, sender),
    }
    files = _content(message, data)
    email_service.send_message(data, files)
    logger.info("Message transféré (%d pièce(s) jointe(s)).", len(files))
    return {"status": "forwarded"}


def _reply(db: Session, token: str, sender: str, message: InboundMessage) -> dict:
    found = reply_service.find_route(db, token)
    if not found:
        logger.warning("Réponse refusée : adresse de réponse inconnue.")
        return {"status": "ignored"}
    alias, correspondent = found
    owner = _deliverable(db, alias)
    if not owner or sender != owner:
        logger.warning("Réponse refusée : expéditeur non autorisé.")
        return {"status": "ignored"}
    data = {
        "from": alias.alias_email,
        "to": correspondent,
        "subject": clean(message.subject) or NO_SUBJECT,
    }
    files = _content(message, data)
    email_service.send_message(data, files)
    logger.info("Réponse envoyée depuis l'alias (%d pièce(s) jointe(s)).", len(files))
    return {"status": "replied"}
