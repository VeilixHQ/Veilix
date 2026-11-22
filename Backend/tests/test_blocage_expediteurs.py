import pytest

from app.models.blocked_sender import BlockedSender
from tests.conftest import entetes, inscrire
from tests.test_reception_et_reponses import alias_actif, recevoir

__all__ = ["alias_actif"]


def bloquer(client, alias, valeur):
    return client.post(f"/alias/{alias['id']}/blocked-senders", headers=entetes(alias["cle"]), json={"sender": valeur})


def alias_de(client, alias):
    return next(a for a in client.get("/alias", headers=entetes(alias["cle"])).json() if a["id"] == alias["id"])


def test_expediteur_bloque_n_est_plus_transfere(client, emails, alias_actif):
    assert bloquer(client, alias_actif, "Jean.Dupont@exemple.org").status_code == 200
    reponse = recevoir(client, alias_actif["alias_email"])
    assert reponse.json() == {"status": "blocked"}
    assert emails == []
    donnees = alias_de(client, alias_actif)
    assert donnees["blocked_count"] == 1
    assert donnees["forwarded_count"] == 0
    liste = client.get(f"/alias/{alias_actif['id']}/blocked-senders", headers=entetes(alias_actif["cle"])).json()
    assert liste[0]["sender"] == "jean.dupont@exemple.org"
    assert liste[0]["blocked_count"] == 1


def test_blocage_d_un_domaine_et_de_ses_sous_domaines(client, emails, alias_actif):
    assert bloquer(client, alias_actif, "exemple.org").json()["sender"] == "@exemple.org"
    assert recevoir(client, alias_actif["alias_email"]).json() == {"status": "blocked"}
    assert recevoir(client, alias_actif["alias_email"], expediteur="Promo <promo@news.exemple.org>").json() == {"status": "blocked"}
    assert recevoir(client, alias_actif["alias_email"], expediteur="Ami <ami@autre.fr>").json() == {"status": "forwarded"}


def test_autres_expediteurs_toujours_transferes_et_comptes(client, emails, alias_actif):
    bloquer(client, alias_actif, "spam@pub.fr")
    assert recevoir(client, alias_actif["alias_email"]).json() == {"status": "forwarded"}
    assert alias_de(client, alias_actif)["forwarded_count"] == 1


def test_expediteur_stocke_chiffre(client, alias_actif, db):
    bloquer(client, alias_actif, "secret@exemple.org")
    ligne = db.query(BlockedSender).one()
    assert "secret" not in ligne.pattern_encrypted
    assert len(ligne.pattern_hmac) == 64


def test_debloquer_retablit_le_transfert(client, emails, alias_actif):
    bloc = bloquer(client, alias_actif, "jean.dupont@exemple.org").json()
    supprime = client.delete(f"/alias/{alias_actif['id']}/blocked-senders/{bloc['id']}", headers=entetes(alias_actif["cle"]))
    assert supprime.status_code == 200
    assert recevoir(client, alias_actif["alias_email"]).json() == {"status": "forwarded"}


def test_alias_coupe_compte_les_messages_bloques(client, emails, alias_actif):
    client.patch(f"/alias/{alias_actif['id']}/disable", headers=entetes(alias_actif["cle"]))
    assert recevoir(client, alias_actif["alias_email"]).json() == {"status": "ignored"}
    assert alias_de(client, alias_actif)["blocked_count"] == 1


@pytest.mark.parametrize("valeur", ["", "pas une adresse", "@", "a@", "exemple", "-mauvais.fr", "x" * 300 + ".fr"])
def test_valeurs_invalides_refusees(client, alias_actif, valeur):
    reponse = bloquer(client, alias_actif, valeur)
    assert reponse.status_code in (400, 422)


def test_impossible_de_bloquer_sur_l_alias_d_un_autre(client, alias_actif):
    autre = inscrire(client)
    reponse = client.post(f"/alias/{alias_actif['id']}/blocked-senders", headers=entetes(autre), json={"sender": "a@b.fr"})
    assert reponse.status_code == 404


def test_supprimer_l_alias_supprime_ses_blocages(client, alias_actif, db):
    bloquer(client, alias_actif, "a@b.fr")
    client.delete(f"/alias/{alias_actif['id']}", headers=entetes(alias_actif["cle"]))
    assert db.query(BlockedSender).count() == 0
