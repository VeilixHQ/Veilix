import secrets
import time

import pytest

from app.models.alias import Alias
from tests.conftest import entetes, inscrire, jeton_de, lien_de_confirmation, signature_mailgun


@pytest.fixture
def alias_actif(client, emails):
    cle = inscrire(client)
    alias = client.post("/alias", headers=entetes(cle), json={"destination_email": "alice@example.com"}).json()
    client.post("/destination/confirm", json={"token": jeton_de(lien_de_confirmation(emails[0]))})
    emails.clear()
    return {"cle": cle, **alias}


def message(destinataire, **signature):
    return {
        **signature,
        "recipient": destinataire,
        "sender": "expediteur@example.com",
        "subject": "Bonjour",
        "body-plain": "Contenu du message",
    }


def test_message_signe_transfere_vers_la_destination(client, emails, alias_actif):
    reponse = client.post("/email/inbound", data=message(alias_actif["alias_email"], **signature_mailgun()))
    assert reponse.json() == {"status": "forwarded"}
    assert len(emails) == 1
    assert emails[0]["to"] == "alice@example.com"


def test_signature_fausse_refusee(client, emails, alias_actif):
    signature = signature_mailgun(cle=secrets.token_hex(32))
    assert client.post("/email/inbound", data=message(alias_actif["alias_email"], **signature)).status_code == 403
    assert emails == []


def test_signature_absente_refusee(client, emails, alias_actif):
    assert client.post("/email/inbound", data=message(alias_actif["alias_email"])).status_code == 403
    assert emails == []


def test_signature_trop_ancienne_refusee(client, emails, alias_actif):
    ancienne = signature_mailgun(timestamp=str(int(time.time()) - 13 * 3600))
    assert client.post("/email/inbound", data=message(alias_actif["alias_email"], **ancienne)).status_code == 403
    assert emails == []


def test_rejeu_du_meme_message_refuse(client, emails, alias_actif):
    signature = signature_mailgun()
    assert client.post("/email/inbound", data=message(alias_actif["alias_email"], **signature)).status_code == 200
    assert client.post("/email/inbound", data=message(alias_actif["alias_email"], **signature)).status_code == 403
    assert len(emails) == 1


def test_sans_cle_de_signature_tout_est_refuse(client, emails, alias_actif, monkeypatch):
    from app.core import mailgun

    monkeypatch.setattr(mailgun, "MAILGUN_SIGNING_KEY", "")
    assert client.post("/email/inbound", data=message(alias_actif["alias_email"], **signature_mailgun())).status_code == 403
    assert emails == []


def test_signature_en_json_acceptee(client, emails, alias_actif):
    corps = {"signature": signature_mailgun(), **message(alias_actif["alias_email"])}
    assert client.post("/email/inbound", json=corps).json() == {"status": "forwarded"}


def test_alias_en_attente_ne_recoit_rien(client, emails):
    cle = inscrire(client)
    alias = client.post("/alias", headers=entetes(cle), json={"destination_email": "inconnu@example.com"}).json()
    emails.clear()
    reponse = client.post("/email/inbound", data=message(alias["alias_email"], **signature_mailgun()))
    assert reponse.json() == {"status": "ignored"}
    assert emails == []


def test_alias_desactive_ne_recoit_rien(client, emails, alias_actif):
    client.patch(f"/alias/{alias_actif['id']}/disable", headers=entetes(alias_actif["cle"]))
    reponse = client.post("/email/inbound", data=message(alias_actif["alias_email"], **signature_mailgun()))
    assert reponse.json() == {"status": "ignored"}
    assert emails == []


def test_alias_inexistant_ignore(client, emails, alias_actif):
    reponse = client.post("/email/inbound", data=message("inconnu@alias.veilix-tests.fr", **signature_mailgun()))
    assert reponse.json() == {"status": "ignored"}
    assert emails == []


def test_echec_d_envoi_libere_le_jeton_pour_la_nouvelle_tentative(client, emails, alias_actif, monkeypatch):
    from app.services import email_service

    def panne(data, files=None):
        raise email_service.MailgunError("HTTP 500")

    signature = signature_mailgun()
    monkeypatch.setattr(email_service, "_post_mailgun", panne)
    assert client.post("/email/inbound", data=message(alias_actif["alias_email"], **signature)).status_code == 502

    monkeypatch.setattr(email_service, "_post_mailgun", lambda data, files=None: emails.append(dict(data)))
    assert client.post("/email/inbound", data=message(alias_actif["alias_email"], **signature)).json() == {"status": "forwarded"}
    assert len(emails) == 1


def test_destinataire_insensible_a_la_casse(client, emails, alias_actif, db):
    assert db.query(Alias).one().alias_email == alias_actif["alias_email"]
    reponse = client.post("/email/inbound", data=message(alias_actif["alias_email"].upper(), **signature_mailgun()))
    assert reponse.json() == {"status": "forwarded"}
