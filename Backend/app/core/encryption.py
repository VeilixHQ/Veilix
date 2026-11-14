import os
import hmac
import base64
import hashlib
from functools import lru_cache
from cryptography.exceptions import InvalidTag
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from fastapi import HTTPException


_KEYS: dict[int, str | None] = {
    1: os.getenv("ENCRYPTION_KEY"),

}

CURRENT_KEY_VERSION = 2
V2_PREFIX = "v2:"
V2_NONCE_BYTES = 12
V2_KEY_INFO = b"veilix-aes-256-gcm-v2"


def _padded_key(version: int) -> str:
    key = _KEYS.get(version)
    if not key:
        raise RuntimeError(
            f"Aucune clé de chiffrement pour la version {version}. "
            "Générez-en une avec : python3 -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
    key = key.strip()
    return key + "=" * (-len(key) % 4)


@lru_cache(maxsize=1)
def _get_aes256_key() -> bytes:
    master = base64.urlsafe_b64decode(_padded_key(1))
    if len(master) != 32:
        raise RuntimeError("ENCRYPTION_KEY doit contenir 32 octets encodés en base64 url-safe.")
    return HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=V2_KEY_INFO).derive(master)


def _get_fernet(version: int = 1) -> Fernet:
    return Fernet(_padded_key(version).encode())


def encrypt(value: str) -> tuple[str, int]:
    if not value:
        return value, CURRENT_KEY_VERSION
    nonce = os.urandom(V2_NONCE_BYTES)
    ciphertext = AESGCM(_get_aes256_key()).encrypt(nonce, value.encode(), None)
    encrypted = V2_PREFIX + base64.urlsafe_b64encode(nonce + ciphertext).decode()
    return encrypted, CURRENT_KEY_VERSION


def decrypt(value: str, version: int = 1) -> str:
    if not value:
        return value
    try:
        if value.startswith(V2_PREFIX):
            raw = base64.urlsafe_b64decode(value[len(V2_PREFIX):])
            nonce, ciphertext = raw[:V2_NONCE_BYTES], raw[V2_NONCE_BYTES:]
            return AESGCM(_get_aes256_key()).decrypt(nonce, ciphertext, None).decode()
        return _get_fernet(1).decrypt(value.encode()).decode()
    except (InvalidToken, InvalidTag, ValueError):
        raise HTTPException(
            status_code=500,
            detail="Erreur de déchiffrement — clé incorrecte, version invalide, ou données corrompues."
        )


def hash_email(email: str) -> str:
    secret = os.getenv("HMAC_SECRET")
    if not secret:
        raise RuntimeError(
            "HMAC_SECRET manquante dans les variables d'environnement. "
            "Générez-en une avec : python3 -c \"import secrets; print(secrets.token_hex(32))\""
        )
    normalized = email.strip().lower()
    return hmac.new(
        secret.encode(),
        normalized.encode(),
        hashlib.sha256
    ).hexdigest()


def is_encrypted(value: str) -> bool:
    return value.startswith(V2_PREFIX) or value.startswith("gAAAAA")