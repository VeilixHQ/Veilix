from app.models.key import Key
from tests.conftest import entetes, inscrire


def creer(client, cle, destination):
    return client.post("/alias", headers=entetes(cle), json={"destination_email": destination})


def compte(client, cle):
    return client.get("/key/me", headers=entetes(cle)).json()


def definir_plan(db, plan):
    db.query(Key).update({Key.plan: plan})
    db.commit()


def test_pro_limite_a_trois_boites_de_destination(client):
    cle = inscrire(client)
    for i in range(3):
        assert creer(client, cle, f"boite{i}@example.com").status_code == 200
    refus = creer(client, cle, "quatrieme@example.com")
    assert refus.status_code == 403
    assert refus.json()["detail"] == "DESTINATION_LIMIT"
    donnees = compte(client, cle)
    assert donnees["destinations_used"] == 3
    assert donnees["destination_limit"] == 3


def test_une_destination_deja_utilisee_reste_autorisee(client):
    cle = inscrire(client)
    for i in range(3):
        creer(client, cle, f"boite{i}@example.com")
    assert creer(client, cle, "boite1@example.com").status_code == 200
    assert creer(client, cle, "BOITE2@example.com".lower()).status_code == 200
    assert compte(client, cle)["aliases_used"] == 5


def test_refus_de_destination_ne_consomme_pas_de_credit(client, db):
    cle = inscrire(client, plan="credits")
    db.query(Key).update({Key.credits: 10})
    db.commit()
    for i in range(3):
        assert creer(client, cle, f"boite{i}@example.com").status_code == 200
    assert creer(client, cle, "boite9@example.com").status_code == 403
    db.expire_all()
    assert db.query(Key).one().credits == 7


def test_pack_limite_a_dix_boites_de_destination(client, db):
    cle = inscrire(client, plan="pack")
    for i in range(10):
        assert creer(client, cle, f"boite{i}@example.com").status_code == 200
    assert creer(client, cle, "onzieme@example.com").status_code == 403
    assert compte(client, cle)["destination_limit"] == 10


def test_supprimer_un_alias_libere_la_boite(client):
    cle = inscrire(client)
    ids = [creer(client, cle, f"boite{i}@example.com").json()["id"] for i in range(3)]
    client.delete(f"/alias/{ids[0]}", headers=entetes(cle))
    assert creer(client, cle, "nouvelle@example.com").status_code == 200
