import re
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta

import pytest

from app.core import config
from app.core.keys import stored_key_id
from app.models.access_code import AccessCode
from app.models.beta import BetaSignup
from app.models.key import Key
from app.services import beta_service
from tests.conftest import code_d_acces, corps_d_inscription, entetes, nouvelle_cle

INVITATION = "lien-secret-de-test"
FORMAT_DU_CODE = r"VEILIX-(?:PRIV|PUB)-[A-Z0-9]{5}-[A-Z0-9]{5}"


@pytest.fixture
def beta(monkeypatch):
    reglages = {
        "BETA_PRIVATE_INVITE_TOKEN": INVITATION,
        "BETA_PRIVATE_SEATS": 2,
        "BETA_PRIVATE_OPENS_AT": None,
        "BETA_PRIVATE_SIGNUPS_CLOSE_AT": None,
        "BETA_PRIVATE_ENDS_AT": None,
        "BETA_PUBLIC_OPENS_AT": None,
        "BETA_PUBLIC_SIGNUPS_CLOSE_AT": None,
        "BETA_PUBLIC_ENDS_AT": None,
        "BETA_PUBLIC_WAVE1_SEATS": 2,
        "BETA_PUBLIC_WAVE2_SEATS": 3,
        "BETA_PUBLIC_WAVE2_AFTER_DAYS": 14,
        "BETA_PUBLIC_WAVE2_HOLD": False,
        "BETA_CODE_VALID_DAYS": 7,
        "LAUNCH_AT": None,
    }
    for nom, valeur in reglages.items():
        monkeypatch.setattr(config, nom, valeur)
    return monkeypatch


def postuler(client, email, invitation=INVITATION, **autres):
    corps = {"email": email, "consent": True, **autres}
    if invitation:
        corps["invitation"] = invitation
    return client.post("/beta/signup", json=corps)


def envoyes_a(emails, adresse):
    return [e for e in emails if e["to"] == adresse]


def code_recu(emails, adresse):
    return re.search(FORMAT_DU_CODE, envoyes_a(emails, adresse)[-1]["text"]).group(0)


def inscrire_avec(client, code, contact=None):
    cle = nouvelle_cle()
    corps = corps_d_inscription(cle, code, contact)
    if contact is None:
        del corps["contact_email"]
    return cle, client.post("/key/register", json=corps)


def test_parcours_prive_complet_du_lien_d_invitation_au_premier_alias(client, beta, emails):
    assert postuler(client, "pionnier@example.com").status_code == 202
    code = code_recu(emails, "pionnier@example.com")
    verification = client.post("/key/check-code", json={"access_code": code.lower().replace("-", " ")}).json()
    assert verification == {"valid": True, "phase": "private", "needs_contact": False}

    cle, inscription = inscrire_avec(client, code)
    assert inscription.status_code == 200
    assert inscription.json()["plan"] == "pack" and inscription.json()["status"] == "active"
    compte = client.get("/key/me", headers=entetes(cle)).json()
    assert compte["alias_quota"] is None
    assert compte["badges"] == [{"id": "pionnier", "number": None}, {"id": "fondateur", "number": 1}]
    assert client.post("/alias", headers=entetes(cle), json={"destination_email": "pionnier@example.com"}).status_code == 200

    assert client.post("/key/check-code", json={"access_code": code}).json() == {"valid": False, "phase": None, "needs_contact": False}
    assert inscrire_avec(client, code)[1].status_code == 403


def test_meme_code_utilise_simultanement_une_seule_cle_creee(client, db):
    code = code_d_acces()
    with ThreadPoolExecutor(max_workers=12) as executeur:
        reponses = list(executeur.map(lambda _: client.post("/key/register", json=corps_d_inscription(nouvelle_cle(), code)), range(12)))
    statuts = [reponse.status_code for reponse in reponses]
    assert statuts.count(200) == 1
    assert set(statuts) <= {200, 403, 409}
    db.expire_all()
    assert db.query(Key).count() == 1
    assert db.query(AccessCode).one().status == "used"
    assert db.query(AccessCode).one().key_id == db.query(Key).one().id


def test_meme_cle_inscrite_simultanement_avec_deux_codes_ne_consomme_qu_un_code(client, db):
    cle = nouvelle_cle()
    codes = [code_d_acces(), code_d_acces()]
    with ThreadPoolExecutor(max_workers=2) as executeur:
        statuts = list(executeur.map(lambda code: client.post("/key/register", json=corps_d_inscription(cle, code)).status_code, codes))
    assert sorted(statuts) == [200, 409]
    db.expire_all()
    assert db.query(Key).count() == 1
    assert sorted(a.status for a in db.query(AccessCode).all()) == ["unused", "used"]


def test_derniere_place_disputee_simultanement_un_seul_code_emis(client, beta, emails, db):
    beta.setattr(config, "BETA_PRIVATE_SEATS", 1)
    adresses = [f"candidat-{i}@example.com" for i in range(8)]
    with ThreadPoolExecutor(max_workers=8) as executeur:
        statuts = list(executeur.map(lambda adresse: postuler(client, adresse).status_code, adresses))
    assert statuts.count(202) == 5 and statuts.count(429) == 3
    db.expire_all()
    assert db.query(AccessCode).count() == 1
    assert sum("VEILIX-PRIV-" in e["text"] for e in emails) == 1
    assert db.query(BetaSignup).filter(BetaSignup.status == "waiting").count() == 4


def test_force_brute_sur_les_codes_bloquee_par_adresse(client):
    essais = [client.post("/key/check-code", json={"access_code": f"VEILIX-PUB-AAAAA-AAA{i:02d}"}) for i in range(11)]
    assert [e.status_code for e in essais[:10]] == [200] * 10
    assert all(e.json() == {"valid": False, "phase": None, "needs_contact": False} for e in essais[:10])
    assert essais[10].status_code == 429 and int(essais[10].headers["Retry-After"]) > 0

    inscriptions = [inscrire_avec(client, f"VEILIX-PRIV-BBBBB-BBB{i:02d}", "x@example.com")[1] for i in range(21)]
    assert [i.status_code for i in inscriptions[:20]] == [403] * 20
    assert len({i.json()["detail"] for i in inscriptions[:20]}) == 1
    assert inscriptions[20].status_code == 429


def test_code_valide_inutilisable_une_fois_l_adresse_bloquee(client):
    code = code_d_acces()
    for i in range(20):
        inscrire_avec(client, f"VEILIX-PRIV-CCCCC-CCC{i:02d}", "x@example.com")
    assert inscrire_avec(client, code, "legitime@example.com")[1].status_code == 429


def test_code_expire_refuse_puis_place_reattribuee(client, beta, emails, db):
    beta.setattr(config, "BETA_PRIVATE_SEATS", 1)
    postuler(client, "premier@example.com")
    postuler(client, "second@example.com")
    code = code_recu(emails, "premier@example.com")
    assert "liste d'attente" in envoyes_a(emails, "second@example.com")[-1]["subject"]

    db.query(AccessCode).update({AccessCode.expires_at: beta_service.now_utc() - timedelta(minutes=1)})
    db.commit()
    assert client.post("/key/check-code", json={"access_code": code}).json()["valid"] is False
    assert inscrire_avec(client, code)[1].status_code == 403

    rapport = beta_service.tick(db)
    assert rapport["expired"] == 1 and rapport["invited"] == 1
    assert "a expiré" in envoyes_a(emails, "premier@example.com")[-1]["text"]
    assert inscrire_avec(client, code_recu(emails, "second@example.com"))[1].status_code == 200


def test_code_prive_refuse_apres_la_fin_de_la_beta_privee(client, beta):
    code = code_d_acces("private", jours=60)
    beta.setattr(config, "BETA_PRIVATE_ENDS_AT", beta_service.now_utc() - timedelta(hours=1))
    assert client.post("/key/check-code", json={"access_code": code}).json()["valid"] is False
    assert inscrire_avec(client, code, "tardif@example.com")[1].status_code == 403


def test_bascule_de_la_beta_privee_vers_l_inscription_publique(client, beta, emails, db):
    maintenant = beta_service.now_utc()
    beta.setattr(config, "BETA_PRIVATE_ENDS_AT", maintenant + timedelta(days=1))
    beta.setattr(config, "BETA_PUBLIC_OPENS_AT", maintenant + timedelta(days=2))
    assert postuler(client, "public-trop-tot@example.com", invitation=None).status_code == 409
    assert postuler(client, "prive@example.com").status_code == 202
    code_prive = code_recu(emails, "prive@example.com")
    assert client.get("/beta/status").json()["public"]["open"] is False

    beta.setattr(config, "BETA_PRIVATE_ENDS_AT", maintenant - timedelta(hours=1))
    beta.setattr(config, "BETA_PUBLIC_OPENS_AT", maintenant - timedelta(minutes=1))
    etat = client.get("/beta/status").json()
    assert etat["private"]["open"] is False and etat["public"]["open"] is True and etat["public"]["wave"] == 1

    assert postuler(client, "prive-trop-tard@example.com").status_code == 409
    assert inscrire_avec(client, code_prive)[1].status_code == 403

    assert postuler(client, "public@example.com", invitation=None).status_code == 202
    code_public = code_recu(emails, "public@example.com")
    assert code_public.startswith("VEILIX-PUB-")
    cle, inscription = inscrire_avec(client, code_public)
    assert inscription.json()["plan"] == "pro" and inscription.json()["status"] == "pending_payment"
    assert client.post("/alias", headers=entetes(cle), json={"destination_email": "public@example.com"}).status_code == 402
    assert client.get("/key/me", headers=entetes(cle)).status_code == 402
    assert db.query(Key).filter(Key.key_id == stored_key_id(cle)).one().contact_email.startswith("v2:")


def test_une_personne_ne_bloque_pas_plusieurs_places_par_variantes_d_adresse(client, beta, emails, db):
    for adresse in ("camille.martin@gmail.com", "camillemartin+beta@gmail.com", "Camille.Martin@googlemail.com", "c.a.m.i.l.l.e.martin+2@gmail.com"):
        assert postuler(client, adresse).status_code == 202
    assert db.query(BetaSignup).count() == 1
    assert db.query(AccessCode).count() == 1
    assert len(emails) == 1 and emails[0]["to"] == "camille.martin@gmail.com"
    assert beta_service.seat_identity("a.b+c@entreprise.example") == "a.b+c@entreprise.example"
    assert beta_service.seat_identity("Lea+x@Proton.me") == beta_service.seat_identity("lea@protonmail.com")


def test_inscriptions_plafonnees_par_adresse_et_globalement(client, beta, emails, monkeypatch):
    from app.core import limiter

    monkeypatch.setattr(limiter, "CLIENT_IP_HEADER", "X-Real-IP")
    monkeypatch.setattr(config, "BETA_SIGNUP_GLOBAL_PER_HOUR", 7)

    def depuis(ip, adresse):
        return client.post("/beta/signup", json={"email": adresse, "consent": True, "invitation": INVITATION}, headers={"X-Real-IP": ip}).status_code

    assert [depuis("192.0.2.10", f"a{i}@example.com") for i in range(6)] == [202] * 5 + [429]
    assert [depuis("192.0.2.11", f"b{i}@example.com") for i in range(3)] == [202, 202, 429]
    assert depuis("192.0.2.12", "c@example.com") == 429
    assert len(emails) == 7


def test_plafond_quotidien_d_inscriptions_par_adresse(client, beta, emails, monkeypatch):
    from sqlalchemy import text

    from app.db.session import engine

    monkeypatch.setattr(config, "BETA_SIGNUP_PER_IP_PER_DAY", 6)
    assert [postuler(client, f"d{i}@example.com").status_code for i in range(5)] == [202] * 5
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM rate_limits WHERE bucket LIKE 'beta-signup:%'"))
    assert [postuler(client, f"e{i}@example.com").status_code for i in range(3)] == [202, 429, 429]


def test_lien_d_invitation_faux_ou_absent_ne_donne_pas_de_place_privee(client, beta, emails, db):
    assert postuler(client, "intrus@example.com", invitation="mauvais-lien").status_code == 403
    assert postuler(client, "public@example.com", invitation=None).status_code == 409
    assert emails == [] and db.query(AccessCode).count() == 0
