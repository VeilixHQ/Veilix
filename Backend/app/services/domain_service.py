import json
import logging
import re
import secrets
from datetime import datetime, timezone

import dns.exception
import dns.resolver
import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core import config
from app.core.encryption import decrypt, encrypt, hash_email
from app.models.alias import Alias
from app.models.custom_domain import CustomDomain
from app.models.key import Key
from app.plans import get_effective_plan, has_pack_features

logger = logging.getLogger("veilix.domains")

MAX_DOMAINS_PER_KEY = 3
VERIFICATION_PREFIX = "veilix-verification="
VERIFICATION_HOST = "_veilix"
LOOKUP_LIFETIME_SECONDS = 4.0
_LABEL = re.compile(r"^(?!-)[a-z0-9-]{1,63}(?<!-)$")
_LOCAL_PART = re.compile(r"^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$")
RESERVED_LOCAL_PARTS = {"postmaster", "abuse"}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _eu_region() -> bool:
    return ".eu." in config.MAILGUN_API_URL


def mx_hosts() -> list[str]:
    suffix = "eu.mailgun.org" if _eu_region() else "mailgun.org"
    return [f"mxa.{suffix}", f"mxb.{suffix}"]


def normalize_domain(raw: str) -> str:
    value = (raw or "").strip().lower().rstrip(".")
    value = value.removeprefix("http://").removeprefix("https://").split("/")[0]
    try:
        value = value.encode("idna").decode("ascii")
    except UnicodeError:
        raise HTTPException(status_code=400, detail="INVALID_DOMAIN")
    labels = value.split(".")
    if len(value) > 253 or len(labels) < 2 or not all(_LABEL.match(label) for label in labels) or labels[-1].isdigit():
        raise HTTPException(status_code=400, detail="INVALID_DOMAIN")
    return value


def is_internal_domain(domain: str) -> bool:
    return any(domain == internal or domain.endswith(f".{internal}") for internal in config.INTERNAL_DOMAINS)


def _require_pack(key: Key) -> None:
    if not has_pack_features(get_effective_plan(key.key_id, key.plan, key.is_admin)):
        raise HTTPException(status_code=403, detail="PACK_REQUIRED")


def _mailgun_request(method: str, path: str, data: dict | None = None) -> dict | None:
    if not config.MAILGUN_API_KEY:
        return None
    response = httpx.request(
        method,
        f"{config.MAILGUN_API_URL}{path}",
        auth=("api", config.MAILGUN_API_KEY),
        data=data,
        timeout=httpx.Timeout(15.0, connect=5.0),
    )
    if response.status_code >= 400:
        raise httpx.HTTPStatusError(f"HTTP {response.status_code}", request=response.request, response=response)
    try:
        return response.json()
    except ValueError:
        return {}


def _sending_records(payload: dict | None) -> list[dict]:
    records = []
    for record in (payload or {}).get("sending_dns_records", []) or []:
        if record.get("record_type") and record.get("name") and record.get("value"):
            records.append({"type": record["record_type"], "name": record["name"], "value": record["value"]})
    return records


def _register_with_mailgun(domain: CustomDomain) -> None:
    try:
        payload = _mailgun_request("POST", "/v4/domains", {"name": domain.domain, "spam_action": "tag"})
    except Exception as exc:
        logger.error("Enregistrement du domaine auprès de Mailgun impossible : %s", type(exc).__name__)
        return
    if payload is None:
        return
    domain.mailgun_registered = True
    domain.mailgun_records = json.dumps(_sending_records(payload))


def unregister_from_mailgun(domain: CustomDomain) -> None:
    if not domain.mailgun_registered:
        return
    try:
        _mailgun_request("DELETE", f"/v3/domains/{domain.domain}")
    except Exception as exc:
        logger.error("Suppression du domaine chez Mailgun impossible : %s", type(exc).__name__)


def required_records(domain: CustomDomain) -> list[dict]:
    records = [
        {"type": "TXT", "name": f"{VERIFICATION_HOST}.{domain.domain}", "value": f"{VERIFICATION_PREFIX}{domain.verification_token}", "purpose": "ownership"},
    ]
    records += [{"type": "MX", "name": domain.domain, "value": host, "priority": 10, "purpose": "receiving"} for host in mx_hosts()]
    stored = json.loads(domain.mailgun_records) if domain.mailgun_records else []
    if stored:
        records += [{**record, "purpose": "sending"} for record in stored]
    else:
        records.append({"type": "TXT", "name": domain.domain, "value": "v=spf1 include:mailgun.org ~all", "purpose": "sending"})
    return records


def _resolve(name: str, kind: str) -> list[str] | None:
    try:
        answers = dns.resolver.resolve(name, kind, lifetime=LOOKUP_LIFETIME_SECONDS)
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
        return []
    except dns.exception.DNSException:
        return None
    if kind == "TXT":
        return ["".join(part.decode("utf-8", "replace") for part in rdata.strings) for rdata in answers]
    if kind == "MX":
        return [str(rdata.exchange).rstrip(".").lower() for rdata in answers]
    return [str(rdata) for rdata in answers]


def dns_status(domain: CustomDomain) -> dict:
    txt = _resolve(f"{VERIFICATION_HOST}.{domain.domain}", "TXT")
    mx = _resolve(domain.domain, "MX")
    expected = f"{VERIFICATION_PREFIX}{domain.verification_token}"
    ownership = bool(txt) and any(value.strip() == expected for value in txt)
    receiving = bool(mx) and all(host in set(mx) for host in mx_hosts()) and set(mx) <= set(mx_hosts())
    return {"ownership": ownership, "receiving": receiving, "lookup_failed": txt is None or mx is None}


def list_domains(db: Session, key: Key) -> list[CustomDomain]:
    return db.query(CustomDomain).filter(CustomDomain.key_id == key.id).order_by(CustomDomain.created_at).all()


def get_domain(db: Session, key: Key, domain_id: int) -> CustomDomain:
    domain = db.query(CustomDomain).filter(CustomDomain.id == domain_id, CustomDomain.key_id == key.id).first()
    if not domain:
        raise HTTPException(status_code=404, detail="Domaine introuvable")
    return domain


def add_domain(db: Session, key: Key, raw: str) -> CustomDomain:
    _require_pack(key)
    name = normalize_domain(raw)
    if is_internal_domain(name):
        raise HTTPException(status_code=400, detail="INVALID_DOMAIN")
    if db.query(CustomDomain).filter(CustomDomain.key_id == key.id).count() >= MAX_DOMAINS_PER_KEY:
        raise HTTPException(status_code=403, detail="DOMAIN_LIMIT")
    if db.query(CustomDomain).filter(CustomDomain.domain == name).first():
        raise HTTPException(status_code=409, detail="DOMAIN_TAKEN")
    domain = CustomDomain(key_id=key.id, domain=name, verification_token=secrets.token_hex(16))
    _register_with_mailgun(domain)
    db.add(domain)
    db.commit()
    db.refresh(domain)
    return domain


def verify_domain(db: Session, key: Key, domain_id: int) -> tuple[CustomDomain, dict]:
    _require_pack(key)
    domain = get_domain(db, key, domain_id)
    status = dns_status(domain)
    domain.last_checked_at = _utc_now()
    if status["ownership"] and status["receiving"]:
        if domain.verified_at is None:
            domain.verified_at = _utc_now()
        if domain.mailgun_registered:
            try:
                _mailgun_request("PUT", f"/v4/domains/{domain.domain}/verify")
            except Exception as exc:
                logger.error("Vérification Mailgun du domaine impossible : %s", type(exc).__name__)
    db.commit()
    db.refresh(domain)
    return domain, status


def configure_catch_all(db: Session, key: Key, domain_id: int, enabled: bool, destination: str | None) -> CustomDomain:
    _require_pack(key)
    domain = get_domain(db, key, domain_id)
    if not enabled:
        domain.catch_all = False
        db.commit()
        return domain
    if domain.verified_at is None:
        raise HTTPException(status_code=409, detail="DOMAIN_NOT_VERIFIED")
    if not destination:
        raise HTTPException(status_code=400, detail="CATCH_ALL_DESTINATION_REQUIRED")
    clean = destination.strip()
    email_hmac = hash_email(clean)
    known = db.query(Alias.id).filter(Alias.key_id == key.id, Alias.email_hmac == email_hmac).first()
    if not known:
        raise HTTPException(status_code=400, detail="CATCH_ALL_DESTINATION_UNKNOWN")
    encrypted, version = encrypt(clean)
    domain.catch_all = True
    domain.catch_all_destination = encrypted
    domain.catch_all_destination_hmac = email_hmac
    domain.catch_all_key_version = version
    db.commit()
    db.refresh(domain)
    return domain


def catch_all_destination(domain: CustomDomain) -> str | None:
    if not domain.catch_all_destination:
        return None
    return decrypt(domain.catch_all_destination, domain.catch_all_key_version or 1)


def remove_domain(db: Session, key: Key, domain_id: int) -> None:
    domain = get_domain(db, key, domain_id)
    if db.query(Alias.id).filter(Alias.domain_id == domain.id).first():
        raise HTTPException(status_code=409, detail="DOMAIN_IN_USE")
    unregister_from_mailgun(domain)
    db.delete(domain)
    db.commit()


def verified_domain_for(db: Session, key: Key, domain_id: int) -> CustomDomain:
    _require_pack(key)
    domain = get_domain(db, key, domain_id)
    if domain.verified_at is None:
        raise HTTPException(status_code=409, detail="DOMAIN_NOT_VERIFIED")
    return domain


def find_verified(db: Session, name: str) -> CustomDomain | None:
    return db.query(CustomDomain).filter(CustomDomain.domain == name, CustomDomain.verified_at.isnot(None)).first()


def is_customer_domain(db: Session, name: str) -> bool:
    return db.query(CustomDomain.id).filter(CustomDomain.domain == name).first() is not None


def normalize_local_part(raw: str) -> str:
    value = (raw or "").strip().lower()
    if not _LOCAL_PART.match(value) or ".." in value or value in RESERVED_LOCAL_PARTS:
        raise HTTPException(status_code=400, detail="INVALID_LOCAL_PART")
    return value


def sending_domain_for(db: Session, alias: Alias) -> str | None:
    if not alias.domain_id:
        return None
    domain = db.get(CustomDomain, alias.domain_id)
    if domain and domain.mailgun_registered and domain.verified_at is not None:
        return domain.domain
    return None
