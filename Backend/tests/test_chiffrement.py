import os

import pytest
from cryptography.fernet import Fernet
from fastapi import HTTPException

from app.core.encryption import V2_PREFIX, decrypt, encrypt, hash_email, is_encrypted
from app.core.keys import is_stored_form, stored_key_id


def test_chiffrement_aller_retour():
    chiffre, version = encrypt("alice@example.com")
    assert chiffre.startswith(V2_PREFIX)
    assert version == 2
    assert "alice" not in chiffre
    assert decrypt(chiffre, version) == "alice@example.com"


def test_deux_chiffrements_du_meme_texte_different():
    assert encrypt("alice@example.com")[0] != encrypt("alice@example.com")[0]


def test_texte_chiffre_altere_refuse_sans_fuite():
    chiffre, version = encrypt("alice@example.com")
    altere = chiffre[:-6] + ("AAAAAA" if not chiffre.endswith("AAAAAA") else "BBBBBB")
    with pytest.raises(HTTPException) as erreur:
        decrypt(altere, version)
    assert erreur.value.status_code == 500
    assert "alice" not in str(erreur.value.detail)


def test_anciennes_donnees_fernet_toujours_lisibles():
    ancien = Fernet(os.environ["ENCRYPTION_KEY"].encode()).encrypt(b"bob@example.com").decode()
    assert is_encrypted(ancien)
    assert decrypt(ancien, 1) == "bob@example.com"


def test_empreinte_email_insensible_casse_et_espaces():
    assert hash_email("  Alice@Example.COM ") == hash_email("alice@example.com")
    assert hash_email("alice@example.com") != hash_email("alice2@example.com")
    assert "alice" not in hash_email("alice@example.com")


def test_empreinte_cle_deterministe_et_non_reversible():
    cle = "a" * 64
    stocke = stored_key_id(cle)
    assert stocke == stored_key_id(cle)
    assert is_stored_form(stocke)
    assert cle not in stocke
