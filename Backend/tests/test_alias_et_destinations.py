from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from app.core.encryption import encrypt, hash_email
from app.core.rate_limit import DAILY_LIMIT, enforce_daily_limit
from app.models.alias import Alias
from app.models.destination import DestinationVerification
from app.models.key import Key
from tests.conftest import entetes, inscrire, jeton_de, lien_de_confirmation


def creer_alias(client, cle, destination="alice@example.com"):
    reponse = client.post("/alias", headers=entetes(cle), json={"destination_email": destination})
    assert reponse.status_code == 200, reponse.text
    return reponse.json()


def test_destination_chiffree_en_base_et_lisible_par_son_proprietaire(client, db):
    cle = inscrire(client)
    alias = creer_alias(client, cle)
    enregistrement = db.query(Alias).one()
    assert enregistrement.destination_email.startswith("v2:")
    assert "alice" not in enregistrement.destination_email
    assert enregistrement.email_hmac == hash_email("alice@example.com")
    assert alias["destination_email"] == "alice@example.com"


def test_alias_aleatoire_sur_le_domaine(client):
    cle = inscrire(client)
    premier = creer_alias(client, cle)["alias_email"]
    second = creer_alias(client, cle)["alias_email"]
    assert premier != second
    assert premier.endswith("@alias.veilix-tests.fr")
    assert "alice" not in premier


def test_nouvelle_destination_en_attente_jusqu_a_confirmation(client, emails):
    cle = inscrire(client)
    alias = creer_alias(client, cle)
    assert alias["status"] == "pending"
    assert alias["confirmation_sent"] is True
    assert len(emails) == 1
    assert emails[0]["to"] == "alice@example.com"

    lien = lien_de_confirmation(emails[0])
    assert "#token=" in lien and "?" not in lien

    reponse = client.post("/destination/confirm", json={"token": jeton_de(lien)})
    assert reponse.status_code == 200
    assert reponse.json() == {"status": "confirmed", "activated_aliases": 1}
    assert client.get("/alias", headers=entetes(cle)).json()[0]["status"] == "active"


def test_jeton_de_confirmation_stocke_en_empreinte_et_a_usage_unique(client, emails, db):
    cle = inscrire(client)
    creer_alias(client, cle)
    jeton = jeton_de(lien_de_confirmation(emails[0]))
    enregistrement = db.query(DestinationVerification).one()
    assert enregistrement.token_hash != jeton
    assert jeton not in enregistrement.token_hash

    assert client.post("/destination/confirm", json={"token": jeton}).status_code == 200
    assert client.post("/destination/confirm", json={"token": jeton}).status_code == 400


def test_jeton_invalide_ou_expire_refuse(client, emails, db):
    cle = inscrire(client)
    creer_alias(client, cle)
    jeton = jeton_de(lien_de_confirmation(emails[0]))
    assert client.post("/destination/confirm", json={"token": "x" * 43}).status_code == 400

    db.query(DestinationVerification).update({DestinationVerification.token_expires_at: datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=1)})
    db.commit()
    assert client.post("/destination/confirm", json={"token": jeton}).status_code == 400
    assert client.get("/alias", headers=entetes(cle)).json()[0]["status"] == "pending"


def test_destination_confirmee_par_un_autre_utilisateur_ne_compte_pas(client, emails):
    alice = inscrire(client)
    creer_alias(client, alice, "partage@example.com")
    client.post("/destination/confirm", json={"token": jeton_de(lien_de_confirmation(emails[0]))})

    bob = inscrire(client)
    assert creer_alias(client, bob, "partage@example.com")["status"] == "pending"


def test_reactivation_d_un_alias_exige_une_destination_confirmee(client):
    cle = inscrire(client)
    alias = creer_alias(client, cle)
    client.patch(f"/alias/{alias['id']}/disable", headers=entetes(cle))
    reponse = client.patch(f"/alias/{alias['id']}/enable", headers=entetes(cle))
    assert reponse.json()["status"] == "pending"


def test_renvoi_de_confirmation_limite(client, emails):
    cle = inscrire(client)
    alias = creer_alias(client, cle)
    assert client.post(f"/alias/{alias['id']}/resend-confirmation", headers=entetes(cle)).status_code == 429
    assert len(emails) == 1


def test_trop_de_destinations_en_attente_bloquees(client, emails):
    cle = inscrire(client)
    statuts = [creer_alias(client, cle, f"dest{i}@example.com")["confirmation_sent"] for i in range(6)]
    assert statuts == [True] * 5 + [False]
    assert len(emails) == 5


def test_quota_du_plan_pro(client, db):
    cle = inscrire(client)
    proprietaire = db.query(Key).one()
    chiffre, version = encrypt("alice@example.com")
    db.add_all([
        Alias(key_id=proprietaire.id, alias_email=f"a{i}@alias.veilix-tests.fr", destination_email=chiffre,
              key_version=version, email_hmac=hash_email("alice@example.com"), status="active")
        for i in range(100)
    ])
    db.commit()
    reponse = client.post("/alias", headers=entetes(cle), json={"destination_email": "alice@example.com"})
    assert reponse.status_code == 403
    assert reponse.json()["detail"] == "LIMIT_REACHED_PRO"


def test_plan_inconnu_ne_peut_rien_creer(client, db):
    cle = inscrire(client)
    db.query(Key).update({Key.plan: "inexistant"})
    db.commit()
    assert client.post("/alias", headers=entetes(cle), json={"destination_email": "alice@example.com"}).status_code == 403


def test_limite_quotidienne_d_actions():
    cle = "b" * 64
    for _ in range(DAILY_LIMIT):
        enforce_daily_limit(cle)
    with pytest.raises(HTTPException) as erreur:
        enforce_daily_limit(cle)
    assert erreur.value.status_code == 429
    assert int(erreur.value.headers["Retry-After"]) > 0


@pytest.mark.parametrize("destination", ["pas-un-email", "a@b", "<script>@x.fr", ""])
def test_destination_invalide_refusee(client, destination):
    cle = inscrire(client)
    assert client.post("/alias", headers=entetes(cle), json={"destination_email": destination}).status_code == 422


def test_libelle_trop_long_refuse(client):
    cle = inscrire(client)
    reponse = client.post("/alias", headers=entetes(cle), json={"destination_email": "alice@example.com", "label": "x" * 65})
    assert reponse.status_code == 422
