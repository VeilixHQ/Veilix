import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

from app.models.access_code import AccessCode
from app.models.key import Key
from app.services.access_service import BETA_TERMS_VERSION, generate_codes, revoke_code
from tests.conftest import code_d_acces, corps_d_inscription, entetes, nouvelle_cle


def inscription(client, code, key_id=None, contact=None, **surcharges):
    corps = {**corps_d_inscription(key_id or nouvelle_cle(), code, contact), **surcharges}
    return client.post("/key/register", json=corps)


def test_codes_individuels_au_bon_format_et_stockes_en_empreinte(db):
    codes = generate_codes(db, "private", 15, 30)
    assert len(set(codes)) == 15
    for code in codes:
        assert re.fullmatch(r"VEILIX-PRIV-[A-HJKMNP-Z2-9]{5}-[A-HJKMNP-Z2-9]{5}", code)
    stockes = [ligne.code_hash for ligne in db.query(AccessCode).all()]
    assert all(len(empreinte) == 64 for empreinte in stockes)
    assert not any(code.split("-")[-1] in empreinte.upper() for code in codes for empreinte in stockes)
    assert generate_codes(db, "public", 1, 30)[0].startswith("VEILIX-PUB-")


def test_verification_du_code_tolere_casse_et_espaces(client):
    code = code_d_acces("public")
    assert client.post("/key/check-code", json={"access_code": f"  {code.lower().replace('-', ' ')} "}).json() == {"valid": True, "phase": "public", "needs_contact": True}
    assert client.post("/key/check-code", json={"access_code": "VEILIX-PRIV-AAAAA-BBBBB"}).json() == {"valid": False, "phase": None, "needs_contact": False}


def test_beta_privee_donne_le_pack_sans_paiement(client, db):
    cle = nouvelle_cle()
    reponse = inscription(client, code_d_acces("private"), key_id=cle, contact="testeur@example.com")
    assert reponse.status_code == 200
    assert reponse.json()["plan"] == "pack"
    assert reponse.json()["status"] == "active"

    enregistrement = db.query(Key).one()
    assert enregistrement.terms_version == BETA_TERMS_VERSION
    assert enregistrement.terms_accepted_at is not None
    assert enregistrement.contact_email.startswith("v2:")
    assert "testeur" not in enregistrement.contact_email

    compte = client.get("/key/me", headers=entetes(cle)).json()
    assert compte["plan"] == "pack"
    assert compte["badges"] == [{"id": "pionnier", "number": None}]
    assert db.query(AccessCode).one().status == "used"


def test_beta_publique_attend_le_paiement(client, db):
    cle = nouvelle_cle()
    reponse = inscription(client, code_d_acces("public"), key_id=cle)
    assert reponse.json()["status"] == "pending_payment"
    assert client.post("/key/verify", json={"key_id": cle}).json()["status"] == "pending_payment"

    refus = client.get("/key/me", headers=entetes(cle))
    assert refus.status_code == 402
    assert refus.json()["detail"] == "PAYMENT_REQUIRED"
    assert client.post("/alias", headers=entetes(cle), json={"destination_email": "a@example.com"}).status_code == 402

    db.query(Key).update({Key.status: "active"})
    db.commit()
    assert client.get("/key/me", headers=entetes(cle)).json()["badges"] == [{"id": "eclaireur", "number": None}]


def test_code_a_usage_unique(client, db):
    code = code_d_acces()
    assert inscription(client, code).status_code == 200
    second = inscription(client, code)
    assert second.status_code == 403
    assert second.json()["detail"] == "Code d'accès invalide, expiré ou déjà utilisé."
    assert db.query(Key).count() == 1


def test_code_expire_ou_revoque_refuse(client, db):
    expire = code_d_acces()
    db.query(AccessCode).update({AccessCode.expires_at: datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=1)})
    db.commit()
    assert inscription(client, expire).status_code == 403

    revoque = code_d_acces()
    revoke_code(db, code=revoque)
    assert inscription(client, revoque).status_code == 403
    assert db.query(Key).count() == 0


def test_conditions_obligatoires_et_code_conserve(client, db):
    code = code_d_acces()
    refus = inscription(client, code, accept_terms=False)
    assert refus.status_code == 400
    assert db.query(AccessCode).one().status == "unused"
    assert inscription(client, code).status_code == 200


def test_adresse_de_contact_obligatoire_et_valide(client):
    code = code_d_acces()
    sans_adresse = client.post("/key/register", json={"key_id": nouvelle_cle(), "access_code": code, "accept_terms": True})
    assert sans_adresse.status_code == 400
    assert sans_adresse.json()["detail"] == "L'adresse de contact est obligatoire."
    assert inscription(client, code, contact="pas-une-adresse").status_code == 422
    assert inscription(client, code).status_code == 200


def test_une_adresse_de_contact_par_cle(client, db):
    assert inscription(client, code_d_acces(), contact="meme@example.com").status_code == 200
    code = code_d_acces()
    doublon = inscription(client, code, contact="MEME@example.com ")
    assert doublon.status_code == 409
    assert db.query(AccessCode).filter(AccessCode.status == "unused").count() == 1


def test_cle_deja_enregistree_ne_consomme_pas_de_code(client, db):
    cle = nouvelle_cle()
    assert inscription(client, code_d_acces(), key_id=cle).status_code == 200
    assert inscription(client, code_d_acces(), key_id=cle).status_code == 409
    assert db.query(AccessCode).filter(AccessCode.status == "unused").count() == 1


def test_revocation_suspend_la_cle_et_retire_le_badge(client, db):
    cle = nouvelle_cle()
    code = code_d_acces()
    inscription(client, code, key_id=cle)
    revoke_code(db, code=code)
    db.expire_all()
    assert db.query(Key).one().status == "suspended"
    assert client.get("/key/me", headers=entetes(cle)).status_code == 403


def test_inscriptions_simultanees_avec_le_meme_code(client, db):
    code = code_d_acces()
    with ThreadPoolExecutor(max_workers=6) as executeur:
        statuts = list(executeur.map(lambda _: inscription(client, code).status_code, range(6)))
    assert statuts.count(200) == 1
    db.expire_all()
    assert db.query(Key).count() == 1


def test_badge_fondateur_numerote(client, db):
    cle = nouvelle_cle()
    inscription(client, code_d_acces(), key_id=cle)
    db.query(Key).update({Key.founder_number: 42})
    db.commit()
    assert client.get("/key/me", headers=entetes(cle)).json()["badges"] == [
        {"id": "pionnier", "number": None},
        {"id": "fondateur", "number": 42},
    ]


def test_verification_de_code_limitee_en_frequence(client):
    codes = [client.post("/key/check-code", json={"access_code": "VEILIX-PUB-AAAAA-AAAAA"}).status_code for _ in range(11)]
    assert codes[:10] == [200] * 10
    assert codes[10] == 429
