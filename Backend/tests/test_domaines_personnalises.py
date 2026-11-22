import pytest

from app.core import config
from app.models.alias import Alias
from app.models.custom_domain import CustomDomain
from app.services import domain_service
from tests.conftest import entetes, inscrire, jeton_de, lien_de_confirmation
from tests.test_reception_et_reponses import recevoir


@pytest.fixture
def dns(monkeypatch):
    zone: dict[tuple[str, str], list[str]] = {}
    monkeypatch.setattr(domain_service, "_resolve", lambda nom, type_: zone.get((nom, type_), []))
    return zone


@pytest.fixture
def mailgun_domaines(monkeypatch):
    monkeypatch.setattr(config, "CUSTOM_DOMAINS_ENABLED", True)
    appels = []

    def repondre(methode, chemin, data=None):
        appels.append((methode, chemin, data))
        if methode == "POST":
            return {"sending_dns_records": [{"record_type": "TXT", "name": "k1._domainkey.exemple.fr", "value": "k=rsa; p=CLE"}]}
        return {}

    monkeypatch.setattr(domain_service, "_mailgun_request", repondre)
    return appels


def ajouter(client, cle, nom="exemple.fr"):
    return client.post("/domains", headers=entetes(cle), json={"domain": nom})


def publier(dns, domaine):
    dns[(f"_veilix.{domaine['domain']}", "TXT")] = [next(r["value"] for r in domaine["records"] if r["purpose"] == "ownership")]
    dns[(domaine["domain"], "MX")] = domain_service.mx_hosts()


def domaine_verifie(client, cle, dns, nom="exemple.fr"):
    domaine = ajouter(client, cle, nom).json()
    publier(dns, domaine)
    reponse = client.post(f"/domains/{domaine['id']}/verify", headers=entetes(cle))
    assert reponse.json()["verified"] is True
    return reponse.json()


def destination_confirmee(client, cle, emails, adresse="alice@example.com"):
    alias = client.post("/alias", headers=entetes(cle), json={"destination_email": adresse}).json()
    client.post("/destination/confirm", json={"token": jeton_de(lien_de_confirmation(emails[-1]))})
    emails.clear()
    return alias


def test_domaines_reserves_au_pack(client, dns, mailgun_domaines):
    cle = inscrire(client, plan="pro")
    reponse = ajouter(client, cle)
    assert reponse.status_code == 403
    assert reponse.json()["detail"] == "PACK_REQUIRED"


def test_ajout_renvoie_les_enregistrements_dns(client, dns, mailgun_domaines):
    cle = inscrire(client, plan="pack")
    domaine = ajouter(client, cle, "Exemple.FR.").json()
    assert domaine["domain"] == "exemple.fr"
    assert domaine["verified"] is False
    types = {(r["type"], r["purpose"]) for r in domaine["records"]}
    assert ("TXT", "ownership") in types and ("MX", "receiving") in types and ("TXT", "sending") in types
    assert any(r["value"] == "k=rsa; p=CLE" for r in domaine["records"])
    assert mailgun_domaines[0][:2] == ("POST", "/v4/domains")


def test_verification_exige_txt_et_mx(client, dns, mailgun_domaines):
    cle = inscrire(client, plan="pack")
    domaine = ajouter(client, cle).json()
    echec = client.post(f"/domains/{domaine['id']}/verify", headers=entetes(cle)).json()
    assert echec["verified"] is False and echec["ownership"] is False
    publier(dns, domaine)
    succes = client.post(f"/domains/{domaine['id']}/verify", headers=entetes(cle)).json()
    assert succes["verified"] is True and succes["receiving"] is True


@pytest.mark.parametrize("nom", ["alias.veilix-tests.fr", "x.mg.veilix-tests.fr", "veilix.fr", "contact.veilix.fr", "pas un domaine", "localhost", "-a.fr"])
def test_domaines_interdits(client, dns, mailgun_domaines, nom):
    cle = inscrire(client, plan="pack")
    assert ajouter(client, cle, nom).status_code == 400


def test_trois_domaines_maximum_et_unicite(client, dns, mailgun_domaines):
    cle = inscrire(client, plan="pack")
    for nom in ("a.fr", "b.fr", "c.fr"):
        assert ajouter(client, cle, nom).status_code == 200
    assert ajouter(client, cle, "d.fr").json()["detail"] == "DOMAIN_LIMIT"
    autre = inscrire(client, plan="pack")
    assert ajouter(client, autre, "a.fr").status_code == 409


def test_alias_personnalise_sur_domaine_verifie(client, emails, dns, mailgun_domaines):
    cle = inscrire(client, plan="pack")
    domaine = domaine_verifie(client, cle, dns)
    alias = client.post("/alias", headers=entetes(cle), json={"destination_email": "alice@example.com", "domain_id": domaine["id"], "local_part": "Boutique"}).json()
    assert alias["alias_email"] == "boutique@exemple.fr"
    assert alias["domain_id"] == domaine["id"]
    doublon = client.post("/alias", headers=entetes(cle), json={"destination_email": "alice@example.com", "domain_id": domaine["id"], "local_part": "boutique"})
    assert doublon.status_code == 409


def test_alias_refuse_sur_domaine_non_verifie(client, dns, mailgun_domaines):
    cle = inscrire(client, plan="pack")
    domaine = ajouter(client, cle).json()
    reponse = client.post("/alias", headers=entetes(cle), json={"destination_email": "alice@example.com", "domain_id": domaine["id"]})
    assert reponse.json()["detail"] == "DOMAIN_NOT_VERIFIED"


def test_destination_sur_domaine_client_refusee(client, dns, mailgun_domaines):
    cle = inscrire(client, plan="pack")
    domaine_verifie(client, cle, dns)
    reponse = client.post("/alias", headers=entetes(cle), json={"destination_email": "moi@exemple.fr"})
    assert reponse.status_code == 400


def test_catch_all_cree_l_alias_et_transfere(client, emails, dns, mailgun_domaines, db):
    cle = inscrire(client, plan="pack")
    destination_confirmee(client, cle, emails)
    domaine = domaine_verifie(client, cle, dns)
    active = client.patch(f"/domains/{domaine['id']}/catch-all", headers=entetes(cle), json={"enabled": True, "destination_email": "alice@example.com"})
    assert active.json()["catch_all"] is True
    reponse = recevoir(client, "nimporte.quoi@exemple.fr")
    assert reponse.json() == {"status": "forwarded"}
    assert emails[0]["to"] == "alice@example.com"
    assert emails[0]["_domain"] == "exemple.fr"
    cree = db.query(Alias).filter(Alias.alias_email == "nimporte.quoi@exemple.fr").one()
    assert cree.label == "catch-all" and cree.status == "active"


def test_sans_catch_all_adresse_inconnue_ignoree(client, emails, dns, mailgun_domaines):
    cle = inscrire(client, plan="pack")
    destination_confirmee(client, cle, emails)
    domaine_verifie(client, cle, dns)
    assert recevoir(client, "inconnu@exemple.fr").json() == {"status": "ignored"}


def test_catch_all_exige_une_destination_connue(client, emails, dns, mailgun_domaines):
    cle = inscrire(client, plan="pack")
    domaine = domaine_verifie(client, cle, dns)
    reponse = client.patch(f"/domains/{domaine['id']}/catch-all", headers=entetes(cle), json={"enabled": True, "destination_email": "jamais@vu.fr"})
    assert reponse.json()["detail"] == "CATCH_ALL_DESTINATION_UNKNOWN"


def test_suppression_refusee_si_alias_puis_acceptee(client, emails, dns, mailgun_domaines, db):
    cle = inscrire(client, plan="pack")
    domaine = domaine_verifie(client, cle, dns)
    alias = client.post("/alias", headers=entetes(cle), json={"destination_email": "alice@example.com", "domain_id": domaine["id"]}).json()
    assert client.delete(f"/domains/{domaine['id']}", headers=entetes(cle)).json()["detail"] == "DOMAIN_IN_USE"
    client.delete(f"/alias/{alias['id']}", headers=entetes(cle))
    assert client.delete(f"/domains/{domaine['id']}", headers=entetes(cle)).status_code == 200
    assert db.query(CustomDomain).count() == 0
    assert ("DELETE", "/v3/domains/exemple.fr", None) in mailgun_domaines


def test_domaine_d_un_autre_invisible(client, dns, mailgun_domaines):
    cle = inscrire(client, plan="pack")
    domaine = ajouter(client, cle).json()
    autre = inscrire(client, plan="pack")
    assert client.post(f"/domains/{domaine['id']}/verify", headers=entetes(autre)).status_code == 404
    assert client.get("/domains", headers=entetes(autre)).json() == []


def test_retour_au_plan_pro_coupe_domaines_et_catch_all(client, emails, dns, mailgun_domaines, db):
    from app.models.key import Key

    cle = inscrire(client, plan="pack")
    destination_confirmee(client, cle, emails)
    domaine = domaine_verifie(client, cle, dns)
    client.patch(f"/domains/{domaine['id']}/catch-all", headers=entetes(cle), json={"enabled": True, "destination_email": "alice@example.com"})
    alias = client.post("/alias", headers=entetes(cle), json={"destination_email": "alice@example.com", "domain_id": domaine["id"], "local_part": "boutique"}).json()
    db.query(Key).update({Key.plan: "pro"})
    db.commit()
    assert recevoir(client, alias["alias_email"]).json() == {"status": "ignored"}
    assert recevoir(client, "autre@exemple.fr").json() == {"status": "ignored"}
    assert emails == []


def test_retour_au_pack_retablit_les_domaines(client, emails, dns, mailgun_domaines, db):
    from app.models.key import Key

    cle = inscrire(client, plan="pack")
    destination_confirmee(client, cle, emails)
    domaine = domaine_verifie(client, cle, dns)
    alias = client.post("/alias", headers=entetes(cle), json={"destination_email": "alice@example.com", "domain_id": domaine["id"], "local_part": "boutique"}).json()
    db.query(Key).update({Key.plan: "pro"})
    db.commit()
    assert recevoir(client, alias["alias_email"]).json() == {"status": "ignored"}
    db.query(Key).update({Key.plan: "pack"})
    db.commit()
    assert recevoir(client, alias["alias_email"]).json() == {"status": "forwarded"}


def test_domaines_indisponibles_tant_que_non_actives(client, dns, monkeypatch):
    monkeypatch.setattr(config, "CUSTOM_DOMAINS_ENABLED", False)
    appels = []
    monkeypatch.setattr(domain_service, "_mailgun_request", lambda *a, **k: appels.append(a))
    cle = inscrire(client, plan="pack")
    reponse = ajouter(client, cle)
    assert reponse.status_code == 503
    assert reponse.json()["detail"] == "CUSTOM_DOMAINS_UNAVAILABLE"
    assert appels == []
    assert client.get("/key/me", headers=entetes(cle)).json()["custom_domains_available"] is False


def test_disponibilite_annoncee_quand_activee(client, mailgun_domaines):
    cle = inscrire(client, plan="pack")
    assert client.get("/key/me", headers=entetes(cle)).json()["custom_domains_available"] is True
