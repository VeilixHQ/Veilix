import logging
from datetime import datetime, timezone
from email.message import EmailMessage
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.policy import SMTP
from email.utils import formatdate, make_msgid

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.key import Key
from app.plans import get_effective_plan, has_pack_features

logger = logging.getLogger("veilix.pgp")

MAX_PUBLIC_KEY_BYTES = 64 * 1024
OUTER_HEADERS = ("From", "To", "Subject", "Reply-To", "Message-Id", "X-Veilix-Hops", "X-Auto-Response-Suppress")


def _sequoia():
    import pysequoia

    return pysequoia


def _require_pack(key: Key) -> None:
    if not has_pack_features(get_effective_plan(key.key_id, key.plan, key.is_admin)):
        raise HTTPException(status_code=403, detail="PACK_REQUIRED")


def _load(armored: str):
    if not armored or len(armored.encode()) > MAX_PUBLIC_KEY_BYTES:
        raise HTTPException(status_code=400, detail="INVALID_PGP_KEY")
    try:
        cert = _sequoia().Cert.from_bytes(armored.strip().encode())
    except Exception:
        raise HTTPException(status_code=400, detail="INVALID_PGP_KEY")
    if cert.has_secret_keys:
        raise HTTPException(status_code=400, detail="PGP_SECRET_KEY_REJECTED")
    if cert.is_revoked:
        raise HTTPException(status_code=400, detail="PGP_KEY_REVOKED")
    expiration = cert.expiration
    if expiration is not None and expiration <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="PGP_KEY_EXPIRED")
    try:
        _sequoia().encrypt(b"veilix", recipients=[cert])
    except Exception:
        raise HTTPException(status_code=400, detail="PGP_KEY_CANNOT_ENCRYPT")
    return cert


def describe(key: Key) -> dict:
    if not key.pgp_public_key:
        return {"configured": False, "enabled": False, "fingerprint": None, "user_ids": [], "expires_at": None}
    try:
        cert = _sequoia().Cert.from_bytes(key.pgp_public_key.encode())
        user_ids = [str(uid.value) if hasattr(uid, "value") else str(uid) for uid in cert.user_ids]
        expires_at = cert.expiration
    except Exception:
        user_ids, expires_at = [], None
    return {
        "configured": True,
        "enabled": bool(key.pgp_enabled),
        "fingerprint": key.pgp_fingerprint,
        "user_ids": user_ids,
        "expires_at": expires_at,
    }


def set_public_key(db: Session, key: Key, armored: str) -> Key:
    _require_pack(key)
    cert = _load(armored)
    key.pgp_public_key = armored.strip()
    key.pgp_fingerprint = str(cert.fingerprint).lower()
    key.pgp_enabled = True
    db.commit()
    db.refresh(key)
    return key


def set_enabled(db: Session, key: Key, enabled: bool) -> Key:
    _require_pack(key)
    if enabled and not key.pgp_public_key:
        raise HTTPException(status_code=409, detail="PGP_KEY_MISSING")
    key.pgp_enabled = enabled
    db.commit()
    db.refresh(key)
    return key


def remove_public_key(db: Session, key: Key) -> Key:
    key.pgp_public_key = None
    key.pgp_fingerprint = None
    key.pgp_enabled = False
    db.commit()
    db.refresh(key)
    return key


def active_cert(key: Key | None):
    if not key or not key.pgp_enabled or not key.pgp_public_key:
        return None
    if not has_pack_features(get_effective_plan(key.key_id, key.plan, key.is_admin)):
        return None
    try:
        return _sequoia().Cert.from_bytes(key.pgp_public_key.encode())
    except Exception:
        logger.error("Clé PGP enregistrée illisible : transfert en clair refusé.")
        raise


def _inner(text: str, html: str, files: list) -> bytes:
    body = EmailMessage(policy=SMTP)
    body.set_content(text or "", subtype="plain", charset="utf-8")
    if html:
        body.add_alternative(html, subtype="html", charset="utf-8")
    if files:
        mixed = EmailMessage(policy=SMTP)
        mixed.make_mixed()
        mixed.attach(body)
        for _, (name, content, content_type) in files:
            maintype, _, subtype = (content_type or "application/octet-stream").partition("/")
            mixed.add_attachment(content, maintype=maintype or "application", subtype=subtype or "octet-stream", filename=name)
        body = mixed
    return body.as_bytes()


def encrypted_mime(data: dict, files: list, cert) -> bytes:
    payload = _sequoia().encrypt(_inner(data.get("text", ""), data.get("html", ""), files), recipients=[cert])
    outer = MIMEMultipart("encrypted", protocol="application/pgp-encrypted")
    control = MIMEBase("application", "pgp-encrypted")
    control.set_payload("Version: 1\n")
    control.add_header("Content-Description", "PGP/MIME version identification")
    outer.attach(control)
    encrypted = MIMEBase("application", "octet-stream", name="encrypted.asc")
    encrypted.set_payload(payload.decode("ascii"))
    encrypted.add_header("Content-Transfer-Encoding", "7bit")
    encrypted.add_header("Content-Description", "OpenPGP encrypted message")
    encrypted.add_header("Content-Disposition", "inline", filename="encrypted.asc")
    outer.attach(encrypted)
    values = {
        "From": data.get("from"),
        "To": data.get("to"),
        "Subject": data.get("subject"),
        "Reply-To": data.get("h:Reply-To"),
        "Message-Id": data.get("h:Message-Id") or make_msgid(domain="veilix.fr"),
        "X-Veilix-Hops": data.get("h:X-Veilix-Hops"),
        "X-Auto-Response-Suppress": data.get("h:X-Auto-Response-Suppress"),
    }
    for name in OUTER_HEADERS:
        if values.get(name):
            outer[name] = values[name]
    outer["Date"] = formatdate(localtime=False)
    outer["MIME-Version"] = "1.0"
    return outer.as_bytes()
