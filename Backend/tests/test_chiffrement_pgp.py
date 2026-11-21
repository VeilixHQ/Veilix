import email
import warnings
from email import policy

import pytest

from app.models.key import Key
from app.services import email_service
from tests.conftest import entetes, inscrire, jeton_de, lien_de_confirmation
from tests.test_reception_et_reponses import recevoir

pysequoia = pytest.importorskip("pysequoia")


@pytest.fixture(scope="module")
def paire():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        secrete = pysequoia.Cert.generate("Alice <alice@example.com>")
    return secrete, str(secrete)


@pytest.fixture
def envois_mime(monkeypatch):
    envoyes = []
    monkeypatch.setattr(email_service, "_post_mailgun_mime", lambda to, mime, domain=None: envoyes.append((to, mime, domain)))
    return envoyes


def alias_pack(client, emails, plan="pack"):
    cle = inscrire(client, plan=plan)
    alias = client.post("/alias", headers=entetes(cle), json={"destination_email": "alice@example.com"}).json()
    client.post("/destination/confirm", json={"token": jeton_de(lien_de_confirmation(emails[0]))})
    emails.clear()
    return cle, alias


def dechiffrer(secrete, mime):
    message = email.message_from_bytes(mime, policy=policy.default)
    assert message.get_content_type() == "multipart/encrypted"
    assert message.get_param("protocol") == "application/pgp-encrypted"
    controle, chiffre = message.get_payload()
    assert controle.get_content_type() == "application/pgp-encrypted"
    armure = chiffre.get_payload(decode=True)
    assert armure.startswith(b"-----BEGIN PGP MESSAGE-----")
    clair = pysequoia.decrypt(armure, decryptor=secrete.secrets.decryptor()).bytes
    return message, email.message_from_bytes(clair, policy=policy.default)


def test_cle_publique_acceptee_et_decrite(client, emails, paire):
    cle, _ = alias_pack(client, emails)
    reponse = client.put("/pgp", headers=entetes(cle), json={"public_key": paire[1]})
    assert reponse.status_code == 200, reponse.text
    donnees = reponse.json()
    assert donnees["configured"] and donnees["enabled"]
    assert len(donnees["fingerprint"]) == 40
    assert any("alice@example.com" in uid for uid in donnees["user_ids"])


def test_cle_secrete_refusee(client, emails, paire):
    cle, _ = alias_pack(client, emails)
    secrete_armure = str(paire[0].secrets)
    reponse = client.put("/pgp", headers=entetes(cle), json={"public_key": secrete_armure})
    assert reponse.json()["detail"] == "PGP_SECRET_KEY_REJECTED"


def test_cle_invalide_refusee(client, emails):
    cle, _ = alias_pack(client, emails)
    reponse = client.put("/pgp", headers=entetes(cle), json={"public_key": "-----BEGIN PGP PUBLIC KEY BLOCK-----\nn'importe quoi\n-----END PGP PUBLIC KEY BLOCK-----"})
    assert reponse.json()["detail"] == "INVALID_PGP_KEY"


def test_pgp_reserve_au_pack(client, emails, paire):
    cle, _ = alias_pack(client, emails, plan="pro")
    assert client.put("/pgp", headers=entetes(cle), json={"public_key": paire[1]}).json()["detail"] == "PACK_REQUIRED"


def test_message_transfere_chiffre_de_bout_en_bout(client, emails, envois_mime, paire):
    cle, alias = alias_pack(client, emails)
    client.put("/pgp", headers=entetes(cle), json={"public_key": paire[1]})
    fichiers = [("attachment-1", ("facture.pdf", b"%PDF-1.4 secret", "application/pdf"))]
    reponse = recevoir(client, alias["alias_email"], fichiers=fichiers, **{"body-plain": "Code secret 4242", "body-html": "<p>Code secret 4242</p>"})
    assert reponse.json() == {"status": "forwarded"}
    assert emails == []
    destinataire, mime, _ = envois_mime[0]
    assert destinataire == "alice@example.com"
    assert b"4242" not in mime and b"%PDF" not in mime
    exterieur, interieur = dechiffrer(paire[0], mime)
    assert exterieur["To"] == "alice@example.com"
    assert exterieur["Reply-To"].startswith("reply+")
    textes = [part.get_content() for part in interieur.walk() if part.get_content_type() in ("text/plain", "text/html")]
    assert any("Code secret 4242" in texte for texte in textes)
    pieces = [part for part in interieur.walk() if part.get_filename() == "facture.pdf"]
    assert pieces and pieces[0].get_content() == b"%PDF-1.4 secret"


def test_desactiver_pgp_retablit_le_transfert_en_clair(client, emails, envois_mime, paire):
    cle, alias = alias_pack(client, emails)
    client.put("/pgp", headers=entetes(cle), json={"public_key": paire[1]})
    assert client.patch("/pgp", headers=entetes(cle), json={"enabled": False}).json()["enabled"] is False
    recevoir(client, alias["alias_email"])
    assert envois_mime == [] and len(emails) == 1


def test_suppression_de_la_cle(client, emails, paire, db):
    cle, _ = alias_pack(client, emails)
    client.put("/pgp", headers=entetes(cle), json={"public_key": paire[1]})
    assert client.delete("/pgp", headers=entetes(cle)).json()["configured"] is False
    db.expire_all()
    assert db.query(Key).one().pgp_public_key is None


def test_retour_au_plan_pro_conserve_le_chiffrement(client, emails, envois_mime, paire, db):
    cle, alias = alias_pack(client, emails)
    client.put("/pgp", headers=entetes(cle), json={"public_key": paire[1]})
    db.query(Key).update({Key.plan: "pro"})
    db.commit()
    recevoir(client, alias["alias_email"])
    assert emails == [] and len(envois_mime) == 1
