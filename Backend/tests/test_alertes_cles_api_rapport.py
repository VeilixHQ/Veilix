from datetime import datetime, timedelta, timezone

import pytest

from app.models.alias import Alias
from app.models.api_token import ApiToken
from app.models.key import Key
from app.services import digest_service, leak_service
from tests.conftest import entetes, inscrire, jeton_de, lien_de_confirmation
from tests.test_reception_et_reponses import recevoir


def maintenant():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def alias_confirme(client, emails, plan="pack"):
    cle = inscrire(client, plan=plan)
    alias = client.post("/alias", headers=entetes(cle), json={"destination_email": "alice@example.com"}).json()
    client.post("/destination/confirm", json={"token": jeton_de(lien_de_confirmation(emails[0]))})
    emails.clear()
    return cle, alias


def vieillir(db, alias_id, jours=10):
    db.query(Alias).filter(Alias.id == alias_id).update({Alias.created_at: maintenant() - timedelta(days=jours)})
    db.commit()


@pytest.mark.parametrize("expediteur, attendu", [
    ("a@news.boutique.fr", "boutique.fr"),
    ("a@mail.shop.co.uk", "shop.co.uk"),
    ("a@localhost", None),
])
def test_domaine_enregistrable(expediteur, attendu):
    assert leak_service.registrable_domain(expediteur) == attendu


def test_alerte_quand_un_nouveau_domaine_ecrit_apres_l_apprentissage(client, emails, db):
    cle, alias = alias_confirme(client, emails)
    recevoir(client, alias["alias_email"], expediteur="Boutique <news@boutique.fr>")
    vieillir(db, alias["id"])
    emails.clear()
    recevoir(client, alias["alias_email"], expediteur="Inconnu <promo@revendeur.com>")
    assert emails[0]["subject"].startswith("[Fuite possible] ")
    assert "revendeur.com" in emails[0]["text"]
    donnees = next(a for a in client.get("/alias", headers=entetes(cle)).json() if a["id"] == alias["id"])
    assert donnees["leak_detected_at"]


def test_pas_d_alerte_pendant_l_apprentissage_ni_pour_un_domaine_connu(client, emails, db):
    cle, alias = alias_confirme(client, emails)
    recevoir(client, alias["alias_email"], expediteur="Boutique <news@boutique.fr>")
    recevoir(client, alias["alias_email"], expediteur="Partenaire <x@mailing.net>")
    vieillir(db, alias["id"])
    recevoir(client, alias["alias_email"], expediteur="Boutique <factures@sav.boutique.fr>")
    assert not any(e["subject"].startswith("[Fuite possible]") for e in emails)


def test_alerte_desactivable_et_reservee_au_pack(client, emails, db):
    cle, alias = alias_confirme(client, emails, plan="pro")
    recevoir(client, alias["alias_email"], expediteur="Boutique <news@boutique.fr>")
    vieillir(db, alias["id"])
    emails.clear()
    recevoir(client, alias["alias_email"], expediteur="Inconnu <promo@revendeur.com>")
    assert not emails[0]["subject"].startswith("[Fuite possible]")


def test_ignorer_l_alerte(client, emails, db):
    cle, alias = alias_confirme(client, emails)
    recevoir(client, alias["alias_email"], expediteur="Boutique <news@boutique.fr>")
    vieillir(db, alias["id"])
    recevoir(client, alias["alias_email"], expediteur="Inconnu <promo@revendeur.com>")
    reponse = client.post(f"/alias/{alias['id']}/leak/dismiss", headers=entetes(cle))
    assert reponse.json()["leak_detected_at"] is None


def test_preferences_enregistrees(client):
    cle = inscrire(client, plan="pack")
    assert client.get("/preferences", headers=entetes(cle)).json()["leak_alerts"] is True
    reponse = client.patch("/preferences", headers=entetes(cle), json={"leak_alerts": False, "weekly_digest": True})
    assert reponse.json()["leak_alerts"] is False and reponse.json()["weekly_digest"] is True


def test_cle_api_creee_utilisable_puis_revoquee(client, db):
    cle = inscrire(client, plan="pack")
    cree = client.post("/api-tokens", headers=entetes(cle), json={"name": "Script"}).json()
    jeton = cree["token"]
    assert jeton.startswith("vlx_") and cree["prefix"] == jeton[:12]
    assert jeton not in db.query(ApiToken).one().token_hash
    bearer = {"Authorization": f"Bearer {jeton}"}
    assert client.post("/alias", headers=bearer, json={"destination_email": "alice@example.com"}).status_code == 200
    assert len(client.get("/alias", headers=bearer).json()) == 1
    assert client.post("/api-tokens", headers=bearer, json={"name": "x"}).status_code == 403
    client.delete(f"/api-tokens/{cree['id']}", headers=entetes(cle))
    assert client.get("/alias", headers=bearer).status_code == 401


def test_cle_api_reservee_au_pack(client, db):
    cle = inscrire(client, plan="pack")
    jeton = client.post("/api-tokens", headers=entetes(cle), json={"name": "Script"}).json()["token"]
    assert client.post("/api-tokens", headers=entetes(inscrire(client, plan="pro")), json={"name": "x"}).json()["detail"] == "PACK_REQUIRED"
    db.query(Key).update({Key.plan: "pro"})
    db.commit()
    assert client.get("/alias", headers={"Authorization": f"Bearer {jeton}"}).status_code == 403


def test_jeton_invalide_refuse(client):
    assert client.get("/alias", headers={"Authorization": "Bearer vlx_inconnu"}).status_code == 401
    assert client.get("/alias", headers={"Authorization": "Basic abc"}).status_code == 422


def test_rapport_hebdomadaire(client, emails, db):
    cle, alias = alias_confirme(client, emails)
    client.patch("/preferences", headers=entetes(cle), json={"weekly_digest": True})
    recevoir(client, alias["alias_email"])
    client.post(f"/alias/{alias['id']}/blocked-senders", headers=entetes(cle), json={"sender": "spam@pub.fr"})
    recevoir(client, alias["alias_email"], expediteur="Pub <spam@pub.fr>")
    emails.clear()
    assert digest_service.send_due(db) == 0
    plus_tard = maintenant() + timedelta(days=8)
    assert digest_service.send_due(db, plus_tard) == 1
    rapport = emails[0]
    assert rapport["to"] == "alice@example.com"
    assert "1 e-mail(s) transféré(s)" in rapport["text"] and "1 e-mail(s) bloqué(s)" in rapport["text"]
    assert digest_service.send_due(db, plus_tard + timedelta(days=1)) == 0
