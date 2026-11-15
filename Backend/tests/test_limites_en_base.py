from concurrent.futures import ThreadPoolExecutor

import pytest
from fastapi import HTTPException
from sqlalchemy import text

from app.core import mailgun, rate_limit
from app.db.session import engine
from tests.conftest import nouvelle_cle


@pytest.fixture(autouse=True)
def entete_ip_du_proxy(monkeypatch):
    from app.core import limiter
    monkeypatch.setattr(limiter, "CLIENT_IP_HEADER", "X-Real-IP")


def lignes(table):
    with engine.connect() as conn:
        return conn.execute(text(f"SELECT * FROM {table}")).mappings().all()


def test_compteur_stocke_en_base_sans_ip_en_clair(client):
    entete = {"X-Real-IP": "203.0.113.42"}
    client.post("/key/verify", json={"key_id": nouvelle_cle()}, headers=entete)
    enregistrements = lignes("rate_limits")
    assert len(enregistrements) == 1
    assert "203.0.113.42" not in enregistrements[0]["bucket"]
    assert enregistrements[0]["bucket"].startswith("verify:")


def test_limite_conservee_apres_redemarrage(client):
    cle = "c" * 64
    for _ in range(rate_limit.DAILY_LIMIT):
        rate_limit.enforce_daily_limit(cle)
    engine.dispose()
    with pytest.raises(HTTPException) as erreur:
        rate_limit.enforce_daily_limit(cle)
    assert erreur.value.status_code == 429
    assert cle not in lignes("rate_limits")[0]["bucket"]


def test_fenetre_expiree_remet_le_compteur_a_zero():
    for _ in range(3):
        rate_limit.hit("essai", "x", 3, 60, "trop")
    with pytest.raises(HTTPException):
        rate_limit.hit("essai", "x", 3, 60, "trop")
    with engine.begin() as conn:
        conn.execute(text("UPDATE rate_limits SET window_start = now() - interval '2 minutes'"))
    rate_limit.hit("essai", "x", 3, 60, "trop")
    assert lignes("rate_limits")[0]["hits"] == 1


def test_limite_tenue_sous_requetes_simultanees():
    def tenter(_):
        try:
            rate_limit.hit("simultane", "y", 10, 60, "trop")
            return True
        except HTTPException:
            return False

    with ThreadPoolExecutor(max_workers=12) as executeur:
        resultats = list(executeur.map(tenter, range(40)))
    assert resultats.count(True) == 10


def test_reponse_429_avec_delai(client):
    entete = {"X-Real-IP": "198.51.100.9"}
    codes = [client.post("/key/verify", json={"key_id": nouvelle_cle()}, headers=entete) for _ in range(121)]
    assert codes[119].status_code == 200
    assert codes[120].status_code == 429
    assert 0 < int(codes[120].headers["Retry-After"]) <= 60


def test_ip_differentes_comptees_separement(client):
    for i in range(20):
        assert client.post("/key/register", json={"key_id": nouvelle_cle()}, headers={"X-Real-IP": "192.0.2.1"}).status_code != 429
    assert client.post("/key/register", json={"key_id": nouvelle_cle()}, headers={"X-Real-IP": "192.0.2.1"}).status_code == 429
    assert client.post("/key/register", json={"key_id": nouvelle_cle()}, headers={"X-Real-IP": "192.0.2.2"}).status_code != 429


def test_jeton_webhook_stocke_en_empreinte_et_refuse_au_rejeu():
    jeton = "a1" * 25
    assert mailgun.claim_token(jeton) is True
    assert mailgun.claim_token(jeton) is False
    enregistrement = lignes("webhook_tokens")[0]
    assert enregistrement["token_hash"] != jeton
    engine.dispose()
    assert mailgun.claim_token(jeton) is False


def test_jeton_libere_si_le_traitement_echoue():
    jeton = "b2" * 25
    assert mailgun.claim_token(jeton)
    mailgun.release_token(jeton)
    assert mailgun.claim_token(jeton)


def test_vieux_jetons_purges():
    mailgun.claim_token("c3" * 25)
    with engine.begin() as conn:
        conn.execute(text("UPDATE webhook_tokens SET claimed_at = now() - interval '13 hours'"))
    mailgun.claim_token("d4" * 25)
    assert len(lignes("webhook_tokens")) == 1
