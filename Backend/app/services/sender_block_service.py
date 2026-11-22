from email_validator import EmailNotValidError, validate_email
from fastapi import HTTPException
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.core.encryption import decrypt, encrypt, hash_email
from app.models.alias import Alias
from app.models.blocked_sender import BlockedSender

MAX_BLOCKED_PER_ALIAS = 200
MAX_DOMAIN_LENGTH = 253


def normalize_pattern(raw: str) -> str:
    value = (raw or "").strip().lower()
    if not value:
        raise HTTPException(status_code=400, detail="INVALID_SENDER")
    if "@" in value and not value.startswith("@"):
        try:
            return validate_email(value, check_deliverability=False).normalized.lower()
        except EmailNotValidError:
            raise HTTPException(status_code=400, detail="INVALID_SENDER")
    domain = value.lstrip("@").rstrip(".")
    labels = domain.split(".")
    if len(domain) > MAX_DOMAIN_LENGTH or len(labels) < 2 or not all(
        label and len(label) <= 63 and all(ch.isalnum() or ch == "-" for ch in label) and not label.startswith("-") and not label.endswith("-")
        for label in labels
    ):
        raise HTTPException(status_code=400, detail="INVALID_SENDER")
    return f"@{domain}"


def _domain_patterns(sender: str) -> list[str]:
    domain = sender.rpartition("@")[2]
    labels = domain.split(".")
    return [f"@{'.'.join(labels[i:])}" for i in range(len(labels) - 1)]


def candidates(sender: str) -> list[str]:
    sender = (sender or "").strip().lower()
    if "@" not in sender:
        return []
    return [hash_email(sender)] + [hash_email(pattern) for pattern in _domain_patterns(sender)]


def matching_block(db: Session, alias_id: int, sender: str) -> BlockedSender | None:
    hashes = candidates(sender)
    if not hashes:
        return None
    return (
        db.query(BlockedSender)
        .filter(BlockedSender.alias_id == alias_id, BlockedSender.pattern_hmac.in_(hashes))
        .first()
    )


def pattern_of(block: BlockedSender) -> str:
    return decrypt(block.pattern_encrypted, block.key_version)


def list_blocks(db: Session, alias: Alias) -> list[BlockedSender]:
    return db.query(BlockedSender).filter(BlockedSender.alias_id == alias.id).order_by(BlockedSender.created_at.desc()).all()


def add_block(db: Session, alias: Alias, raw: str) -> BlockedSender:
    pattern = normalize_pattern(raw)
    pattern_hmac = hash_email(pattern)
    existing = db.query(BlockedSender).filter(BlockedSender.alias_id == alias.id, BlockedSender.pattern_hmac == pattern_hmac).first()
    if existing:
        return existing
    if db.query(BlockedSender).filter(BlockedSender.alias_id == alias.id).count() >= MAX_BLOCKED_PER_ALIAS:
        raise HTTPException(status_code=403, detail="BLOCK_LIMIT")
    encrypted, version = encrypt(pattern)
    block = BlockedSender(alias_id=alias.id, pattern_hmac=pattern_hmac, pattern_encrypted=encrypted, key_version=version)
    db.add(block)
    db.commit()
    db.refresh(block)
    return block


def remove_block(db: Session, alias: Alias, block_id: int) -> None:
    block = db.query(BlockedSender).filter(BlockedSender.id == block_id, BlockedSender.alias_id == alias.id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Expéditeur bloqué introuvable")
    db.delete(block)
    db.commit()


def count_forwarded(db: Session, alias_id: int) -> None:
    db.execute(update(Alias).where(Alias.id == alias_id).values(forwarded_count=Alias.forwarded_count + 1))
    db.commit()


def count_blocked(db: Session, alias_id: int, block_id: int | None = None) -> None:
    db.execute(update(Alias).where(Alias.id == alias_id).values(blocked_count=Alias.blocked_count + 1))
    if block_id is not None:
        db.execute(update(BlockedSender).where(BlockedSender.id == block_id).values(blocked_count=BlockedSender.blocked_count + 1))
    db.commit()
