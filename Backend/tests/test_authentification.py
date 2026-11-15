import pytest

from app.models.alias import Alias
from app.models.key import Key
from tests.conftest import entetes, inscrire, nouvelle_cle


def test_route_protegee_sans_cle(client):
    assert client.get("/alias").status_code == 422


@pytest.mark.parametrize("cle", ["", "abc", "G" * 64, "A" * 64, "a" * 63, "a" * 65, "h:" + "a" * 62])
def test_cle_mal_formee_refusee(client, cle):
    assert client.get("/alias", headers=entetes(cle)).status_code == 401


def test_cle_inconnue_refusee(client):
    assert client.get("/alias", headers=entetes(nouvelle_cle())).status_code == 401


def test_cle_suspendue_refusee(client, db):
    cle = inscrire(client)
    db.query(Key).update({Key.status: "suspended"})
    db.commit()
    assert client.get("/alias", headers=entetes(cle)).status_code == 403


def test_empreinte_stockee_ne_permet_pas_de_se_connecter(client, db):
    inscrire(client)
    stocke = db.query(Key).one().key_id
    assert client.get("/alias", headers=entetes(stocke)).status_code == 401
    assert client.post("/key/verify", json={"key_id": stocke}).status_code == 422


def test_cle_et_email_de_contact_jamais_en_clair(client, db):
    cle = inscrire(client, contact_email="secours@example.com")
    enregistrement = db.query(Key).one()
    assert enregistrement.key_id.startswith("h:")
    assert cle not in enregistrement.key_id
    assert enregistrement.contact_email.startswith("v2:")
    assert "secours" not in enregistrement.contact_email
    assert "secours" not in enregistrement.contact_email_hmac


def test_verify_ne_divulgue_rien_pour_une_cle_inconnue(client):
    reponse = client.post("/key/verify", json={"key_id": nouvelle_cle()})
    assert reponse.status_code == 200
    assert reponse.json() == {"exists": False, "plan": None, "status": None}


def test_un_utilisateur_ne_touche_pas_aux_alias_d_un_autre(client, db):
    alice = inscrire(client)
    bob = inscrire(client)
    alias_id = client.post("/alias", headers=entetes(alice), json={"destination_email": "alice@example.com"}).json()["id"]

    assert client.get("/alias", headers=entetes(bob)).json() == []
    assert client.patch(f"/alias/{alias_id}/disable", headers=entetes(bob)).status_code == 404
    assert client.patch(f"/alias/{alias_id}/enable", headers=entetes(bob)).status_code == 404
    assert client.post(f"/alias/{alias_id}/resend-confirmation", headers=entetes(bob)).status_code == 404
    assert client.delete(f"/alias/{alias_id}", headers=entetes(bob)).status_code == 404
    assert db.query(Alias).filter(Alias.id == alias_id).count() == 1


def test_inscription_limitee_en_frequence(client):
    codes = [client.post("/key/register", json={"key_id": nouvelle_cle()}).status_code for _ in range(21)]
    assert 429 not in codes[:20]
    assert codes[20] == 429


def test_inscription_sans_code_refusee(client, db):
    reponse = client.post("/key/register", json={"key_id": nouvelle_cle(), "contact_email": "a@example.com", "accept_terms": True})
    assert reponse.status_code == 422
    assert db.query(Key).count() == 0


def test_inscription_publique_n_active_pas_de_plan_sans_paiement(client, db):
    inscrire(client, phase="public", plan=None)
    assert db.query(Key).one().status == "pending_payment"
