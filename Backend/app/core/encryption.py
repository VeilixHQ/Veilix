"""
core/encryption.py
──────────────────────────────────────────────────────────
Deux mécanismes distincts, pour deux besoins distincts :

1. ENCRYPTION_KEY (Fernet / AES) — chiffrement RÉVERSIBLE.
   Utilisé pour stocker destination_email de façon à pouvoir
   le déchiffrer plus tard (affichage dashboard, forwarding email).

2. HMAC_SECRET — hash NON réversible.
   Utilisé pour email_hmac : permet de comparer/rechercher des emails
   (ex: vérifier qu'un email n'est pas déjà utilisé) SANS jamais
   déchiffrer ni exposer l'email en clair dans une requête SQL.

Les deux clés sont volontairement séparées et indépendantes :
un attaquant qui obtient l'une ne peut rien faire avec l'autre.

Rotation de clé (key_version) :
  V1 = clé actuelle unique. Pour une V2 (ex: passage à un KMS) :
    1. Ajouter ENCRYPTION_KEY_V2 dans l'environnement
    2. L'enregistrer dans _KEYS avec version=2
    3. Passer CURRENT_KEY_VERSION = 2
  Les anciennes lignes (key_version=1) restent lisibles automatiquement.
  Aucune migration big-bang nécessaire.
"""

import os
import hmac
import hashlib
from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException




_KEYS: dict[int, str | None] = {
    1: os.getenv("ENCRYPTION_KEY"),

}

CURRENT_KEY_VERSION = 1


def _get_fernet(version: int = CURRENT_KEY_VERSION) -> Fernet:
    key = _KEYS.get(version)
    if not key:
        raise RuntimeError(
            f"Aucune clé de chiffrement pour la version {version}. "
            "Générez-en une avec : python3 -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
    return Fernet(key.encode())


def encrypt(value: str) -> tuple[str, int]:
    """Chiffre avec la clé courante. Retourne (valeur_chiffrée, version)."""
    if not value:
        return value, CURRENT_KEY_VERSION
    encrypted = _get_fernet(CURRENT_KEY_VERSION).encrypt(value.encode()).decode()
    return encrypted, CURRENT_KEY_VERSION


def decrypt(value: str, version: int = 1) -> str:
    """Déchiffre une valeur préalablement chiffrée avec encrypt()."""
    if not value:
        return value
    try:
        return _get_fernet(version).decrypt(value.encode()).decode()
    except InvalidToken:
        raise HTTPException(
            status_code=500,
            detail="Erreur de déchiffrement — clé incorrecte, version invalide, ou données corrompues."
        )




def hash_email(email: str) -> str:
    """
    Génère un HMAC-SHA256 de l'email, normalisé (lowercase, trim).
    Ce hash est déterministe : le même email donne toujours le même
    hash, ce qui permet de rechercher/comparer sans déchiffrer.
    Impossible de retrouver l'email original depuis ce hash.
    """
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
    """Vérifie si une valeur est déjà chiffrée (tokens Fernet commencent par 'gAAAAA')."""
    return value.startswith("gAAAAA")