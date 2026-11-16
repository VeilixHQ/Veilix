import hashlib
import hmac
import logging
from dataclasses import dataclass, field
from email.utils import formataddr, parseaddr

from sqlalchemy.orm import Session

from app.core import config, dmarc, rate_limit
from app.core.config import INTERNAL_DOMAINS
from app.core.encryption import decrypt, is_encrypted
from app.models.alias import Alias
from app.models.key import Key
from app.services import email_service, privacy, reply_service, sender_auth
from app.services.destination_service import is_verified

logger = logging.getLogger("veilix.inbound")

MAX_ATTACHMENTS = 20
MAX_ATTACHMENTS_BYTES = 15 * 1024 * 1024
MAX_RECEIVED_HEADERS = 30
HOUR_SECONDS = 3600
DAY_SECONDS = 24 * 3600
OVERSIZE_NOTICE = "[Veilix] Pièces jointes non transférées (taille supérieure à 15 Mo)."
REFUSED_NOTICE = "[Veilix] Pièces jointes non transférées (refusées par le service d'envoi)."
EMPTY_BODY_NOTICE = "[Veilix] Ce message ne contient pas de texte."
ATTACHMENT_ONLY_NOTICE = "[Veilix] Ce message ne contient pas de texte : son contenu se trouve en pièce jointe."
NO_REPLY_NOTICE = "[Veilix] Expéditeur non authentifié : la réponse via l'alias est désactivée pour ce message."
SPAM_TAG = "[Spam ?] "
SUSPECT_TAG = "[Expéditeur non vérifié] "
NO_SUBJECT = "(sans objet)"
IGNORED = {"status": "ignored"}


class Deferred(Exception):
    pass


class Rejected(Exception):
    pass


@dataclass
class InboundMessage:
    recipient: str
    from_header: str
    envelope_sender: str
    subject: str
    text: str
    html: str
    attachments: list[tuple[str, bytes, str]] = field(default_factory=list)
    headers: list[tuple[str, str]] = field(default_factory=list)
    dedupe_key: str | None = None


def normalize_address(value: str) -> str:
    return parseaddr(value or "")[1].strip().lower()


def clean(value: str) -> str:
    return " ".join("".join(ch for ch in (value or "") if ch.isprintable() or ch.isspace()).split())


def is_internal(address: str) -> bool:
    return address.rpartition("@")[2] in INTERNAL_DOMAINS


def sender_of(message: InboundMessage) -> str:
    return normalize_address(message.from_header) or normalize_address(message.envelope_sender)


def destination_of(alias: Alias) -> str:
    stored = alias.destination_email
    return (decrypt(stored, alias.key_version) if is_encrypted(stored) else stored).strip().lower()


def _deliverable(db: Session, alias: Alias | None) -> str | None:
    if not alias or alias.status != "active":
        return None
    key = db.get(Key, alias.key_id)
    if not key or key.status != "active":
        return None
    if not is_verified(db, alias.key_id, alias.email_hmac):
        return None
    destination = destination_of(alias)
    if not destination or is_internal(destination):
        return None
    return destination


def _with_notice(data: dict, notice: str) -> None:
    data["text"] = f"{data.get('text', '')}\n\n{notice}".strip()
    if data.get("html"):
        data["html"] = f"{data['html']}<p>{notice}</p>"


def _content(text: str, html: str, attachments: list[tuple[str, bytes, str]], data: dict) -> list:
    kept = attachments[:MAX_ATTACHMENTS]
    files = [("attachment", item) for item in kept]
    data["text"] = text or ""
    if html:
        data["html"] = html
    if sum(len(content) for _, content, _ in kept) > MAX_ATTACHMENTS_BYTES:
        files = []
        _with_notice(data, OVERSIZE_NOTICE)
    if not data["text"].strip() and not (html or "").strip():
        data["text"] = ATTACHMENT_ONLY_NOTICE if files else EMPTY_BODY_NOTICE
    data["o:tracking"] = "no"
    return files


def _outbound_id(dedupe_key: str | None, kind: str) -> str | None:
    if not dedupe_key or not config.HMAC_SECRET:
        return None
    digest = hmac.new(config.HMAC_SECRET.encode(), f"outbound:{kind}:{dedupe_key}".encode(), hashlib.sha256).hexdigest()
    return f"<{digest[:40]}@{config.MAILGUN_DOMAIN or config.DOMAIN}>"


def _send(data: dict, files: list) -> int:
    try:
        email_service.send_message(data, files)
        return len(files)
    except email_service.MailgunRejected:
        if not files:
            raise Rejected()
    degraded = dict(data)
    _with_notice(degraded, REFUSED_NOTICE)
    try:
        email_service.send_message(degraded, [])
    except email_service.MailgunRejected:
        raise Rejected()
    return 0


def _throttle(limits: tuple[tuple[str, str, int, int], ...]) -> None:
    for scope, identifier, limit, window in limits:
        if not rate_limit.allow(scope, identifier, limit, window):
            raise Deferred()


def process(db: Session, message: InboundMessage) -> dict:
    recipient = normalize_address(message.recipient)
    sender = sender_of(message)
    if not recipient or not sender:
        return dict(IGNORED)
    token = reply_service.reply_token(recipient)
    if token is not None:
        return _reply(db, token, sender, message)
    return _forward(db, recipient, sender, message)


def _forward(db: Session, recipient: str, sender: str, message: InboundMessage) -> dict:
    alias = db.query(Alias).filter(Alias.alias_email == recipient).first()
    destination = _deliverable(db, alias)
    if not destination:
        return dict(IGNORED)
    headers = message.headers
    hops = sender_auth.hops(headers)
    if hops >= config.MAX_FORWARD_HOPS or sender_auth.received_count(headers) > MAX_RECEIVED_HEADERS:
        logger.warning("Message refusé : boucle de transfert détectée.")
        return dict(IGNORED)
    flagged, score = sender_auth.spam_verdict(headers)
    if flagged and score is not None and score >= config.SPAM_DROP_SCORE:
        logger.warning("Message refusé : classé indésirable par le filtre entrant.")
        return dict(IGNORED)
    policy_of = dmarc.policy if config.DMARC_ENFORCEMENT else None
    trust = sender_auth.forward_trust(headers, message.from_header, message.envelope_sender, policy_of)
    if trust == sender_auth.REJECTED:
        logger.warning("Message refusé : expéditeur usurpé (échec SPF, DKIM ou DMARC).")
        return dict(IGNORED)
    _throttle((
        ("fwd-alias-hour", str(alias.id), config.FORWARD_LIMIT_PER_ALIAS_HOUR, HOUR_SECONDS),
        ("fwd-key-day", str(alias.key_id), config.FORWARD_LIMIT_PER_KEY_DAY, DAY_SECONDS),
    ))

    subject = clean(message.subject) or NO_SUBJECT
    if flagged:
        subject = SPAM_TAG + subject
    elif trust == sender_auth.SUSPECT:
        subject = SUSPECT_TAG + subject
    display_name = clean(parseaddr(message.from_header or "")[0]) or sender
    data = {
        "from": formataddr((f"{display_name} via Veilix", alias.alias_email)),
        "to": destination,
        "subject": subject,
        "h:X-Veilix-Hops": str(hops + 1),
        "h:X-Auto-Response-Suppress": "OOF, AutoReply",
    }
    attachments = [
        (privacy.safe_filename(name, f"piece-{index}"), content, content_type)
        for index, (name, content, content_type) in enumerate(message.attachments[:MAX_ATTACHMENTS], start=1)
    ]
    reply_allowed = trust == sender_auth.AUTHENTICATED or not config.REPLY_REQUIRE_AUTHENTICATED_SENDER
    if reply_allowed:
        reply_address = reply_service.reply_address(db, alias, sender)
        data["h:Reply-To"] = reply_address
        attachments = [privacy.redirect_organizer(item, sender, reply_address) for item in attachments]
    outbound_id = _outbound_id(message.dedupe_key, "forward")
    if outbound_id:
        data["h:Message-Id"] = outbound_id
    files = _content(message.text, message.html, attachments, data)
    if not reply_allowed:
        _with_notice(data, NO_REPLY_NOTICE)
    sent = _send(data, files)
    logger.info("Message transféré (%d pièce(s) jointe(s)).", sent)
    return {"status": "forwarded"}


def _reply(db: Session, token: str, sender: str, message: InboundMessage) -> dict:
    found = reply_service.find_route(db, token)
    if not found:
        logger.warning("Réponse refusée : adresse de réponse inconnue.")
        return dict(IGNORED)
    alias, correspondent = found
    owner = _deliverable(db, alias)
    if not owner or sender != owner:
        logger.warning("Réponse refusée : expéditeur non autorisé.")
        return dict(IGNORED)
    if not sender_auth.sender_authenticated(message.headers, message.from_header, message.envelope_sender):
        if sender_auth.has_verdict(message.headers):
            logger.warning("Réponse refusée : expéditeur non authentifié par SPF ou DKIM.")
        else:
            logger.warning("Réponse refusée : verdict SPF/DKIM absent, activer « Mark spam with MIME headers » dans Mailgun.")
        return dict(IGNORED)
    if sender_auth.auto_submitted(message.headers):
        logger.info("Réponse automatique non relayée.")
        return dict(IGNORED)
    if is_internal(correspondent) and reply_service.reply_token(correspondent) is not None:
        logger.warning("Réponse refusée : correspondant interne.")
        return dict(IGNORED)
    _throttle((
        ("reply-key-hour", str(alias.key_id), config.REPLY_LIMIT_PER_KEY_HOUR, HOUR_SECONDS),
        ("reply-key-day", str(alias.key_id), config.REPLY_LIMIT_PER_KEY_DAY, DAY_SECONDS),
    ))

    reply_address = normalize_address(message.recipient)
    scrubber = privacy.Scrubber({owner: alias.alias_email, reply_address: correspondent})
    data = {
        "from": alias.alias_email,
        "to": correspondent,
        "subject": scrubber.text(clean(message.subject)) or NO_SUBJECT,
    }
    attachments = [
        scrubber.attachment(item, index)
        for index, item in enumerate(message.attachments[:MAX_ATTACHMENTS], start=1)
    ]
    outbound_id = _outbound_id(message.dedupe_key, "reply")
    if outbound_id:
        data["h:Message-Id"] = outbound_id
    files = _content(scrubber.text(message.text), scrubber.text(message.html), attachments, data)
    sent = _send(data, files)
    logger.info("Réponse envoyée depuis l'alias (%d pièce(s) jointe(s)).", sent)
    return {"status": "replied"}
