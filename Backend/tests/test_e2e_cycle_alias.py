from email.utils import parseaddr

import pytest

from app.models.alias import Alias
from app.models.reply_route import ReplyRoute
from tests.conftest import entetes, inscrire
from tests.outils_email import ADRESSE_REELLE, SPF_OK, creer_alias, entetes_transmis, recevoir

ENTETES_AUTORISES_EN_TRANSFERT = {
    "received", "return-path", "from", "to", "subject", "date", "reply-to", "message-id", "mime-version",
    "content-type", "content-transfer-encoding", "x-veilix-hops", "x-auto-response-suppress", "x-mailgun-sending-ip",
}
ENTETES_AUTORISES_EN_REPONSE = ENTETES_AUTORISES_EN_TRANSFERT - {"reply-to", "x-veilix-hops", "x-auto-response-suppress"}

ENTETES_DU_MESSAGE_EXTERNE = [
    ["Received", "from smtp.exemple.org (smtp.exemple.org [198.51.100.7]) by mxa.mailgun.org"],
    ["Received", "from poste-de-jean (unknown [192.0.2.44]) by smtp.exemple.org"],
    ["Return-Path", "<jean.dupont@exemple.org>"],
    ["Authentication-Results", "mxa.mailgun.org; spf=pass smtp.mailfrom=exemple.org; dkim=pass header.d=exemple.org"],
    ["DKIM-Signature", "v=1; a=rsa-sha256; d=exemple.org; s=s2026; b=Zm9v"],
    ["X-Mailgun-Spf", "Pass"],
    ["X-Mailgun-Dkim-Check-Result", "Pass"],
    ["X-Originating-IP", "[192.0.2.44]"],
    ["X-Mailer", "Thunderbird 140"],
    ["Message-Id", "<facture-2026-11@exemple.org>"],
    ["To", "Service client <placeholder>"],
    ["Cc", "comptable@tiers.example"],
    ["Disposition-Notification-To", "jean.dupont@exemple.org"],
]

REPONSE_OUTLOOK = (
    "Bien reçu, merci.\r\n\r\n"
    "Alice Martin\r\n\r\n"
    "-----Message d'origine-----\r\n"
    "De : Jean Dupont via Veilix <{alias}>\r\n"
    "Envoyé : dimanche 15 novembre 2026 10:02\r\n"
    "À : {reelle}\r\n"
    "Objet : Facture de novembre\r\n\r\n"
    "Bonjour, voici la facture.\r\n"
)
REPONSE_HTML = (
    "<p>Bien reçu, merci.</p><hr>"
    "<p><b>De :</b> Jean Dupont via Veilix &lt;{alias}&gt;<br>"
    "<b>À :</b> <a href=\"mailto:ALICE%40example.com\">Alice@Example.com</a><br>"
    "<b>Répondre à :</b> {retour}</p>"
)
INVITATION_ACCEPTEE = (
    "BEGIN:VCALENDAR\r\nMETHOD:REPLY\r\nBEGIN:VEVENT\r\nUID:reunion-42@exemple.org\r\n"
    "ORGANIZER;CN=Jean Dupont:mailto:{retour}\r\n"
    "ATTENDEE;CN=Alice Martin;PARTSTAT=ACCEPTED;ROLE=REQ-PARTICIPANT:mailto:alice@exa\r\n"
    " mple.com\r\n"
    "END:VEVENT\r\nEND:VCALENDAR\r\n"
)
COURRIEL_JOINT = (
    "Delivered-To: alice@example.com\r\nTo: Alice Martin <alice@example.com>\r\n"
    "From: Jean Dupont via Veilix <alias>\r\nSubject: Facture\r\n\r\nCorps\r\n"
)


@pytest.fixture
def alias(client_reel, mailgun):
    return creer_alias(client_reel, mailgun)


def test_cycle_complet_creation_reception_reponse_sans_fuite(client_reel, mailgun, db):
    cle = inscrire(client_reel)
    creation = client_reel.post("/alias", headers=entetes(cle), json={"destination_email": ADRESSE_REELLE, "label": "Boutique"})
    assert creation.status_code == 200
    alias = creation.json()
    assert alias["status"] == "pending" and alias["confirmation_sent"] is True
    assert alias["alias_email"].endswith("@alias.veilix-tests.fr")
    assert db.query(Alias).one().destination_email.startswith("v2:")
    assert ADRESSE_REELLE not in db.query(Alias).one().destination_email

    assert recevoir(client_reel, alias["alias_email"]).json() == {"status": "ignored"}
    confirmation = mailgun.envoyes_a(ADRESSE_REELLE)
    assert len(confirmation) == 1
    jeton = confirmation[0].data["text"].split("#token=", 1)[1].split()[0]
    assert client_reel.post("/destination/confirm", json={"token": jeton}).json()["activated_aliases"] == 1
    mailgun.messages.clear()

    entetes_externes = [[nom, valeur.replace("placeholder", alias["alias_email"])] for nom, valeur in ENTETES_DU_MESSAGE_EXTERNE]
    reception = recevoir(
        client_reel,
        alias["alias_email"],
        entetes_mailgun=entetes_externes,
        fichiers=[("attachment-1", ("facture.pdf", b"%PDF-1.7 facture", "application/pdf"))],
    )
    assert reception.json() == {"status": "forwarded"}
    assert len(mailgun.messages) == 1
    transfere = mailgun.messages[0]
    recu = transfere.message

    assert recu["From"] == f"Jean Dupont via Veilix <{alias['alias_email']}>"
    assert recu["To"] == ADRESSE_REELLE
    assert recu["Subject"] == "Facture de novembre"
    retour = parseaddr(recu["Reply-To"])[1]
    assert retour.startswith("reply+") and retour.endswith("@mg.veilix-tests.fr")
    assert recu["X-Veilix-Hops"] == "1"
    assert recu["Message-Id"].endswith("@mg.veilix-tests.fr>")
    assert parseaddr(recu["Return-Path"])[1].endswith("@mg.veilix-tests.fr")
    assert {nom.lower() for nom in recu.keys()} <= ENTETES_AUTORISES_EN_TRANSFERT
    assert len(recu.get_all("Received")) == 1
    for fragment in ("198.51.100.7", "192.0.2.44", "comptable@tiers.example", "Thunderbird", "rsa-sha256", "smtp.exemple.org"):
        assert not transfere.contient(fragment)
    assert transfere.piece("facture.pdf") == b"%PDF-1.7 facture"
    assert transfere.data["o:tracking"] == "no"

    mailgun.messages.clear()
    reponse = recevoir(
        client_reel,
        retour,
        expediteur="Alice Martin <Alice@Example.com>",
        entetes_mailgun=[
            ["Received", "from mail-sor-f41.google.com (209.85.220.41) by mxa.mailgun.org"],
            ["X-Mailgun-Spf", "Pass"],
            ["X-Mailgun-Dkim-Check-Result", "Pass"],
            ["DKIM-Signature", "v=1; a=rsa-sha256; d=example.com; s=20230601; b=YmFy"],
            ["Message-Id", "<CAF0000@mail.example.com>"],
            ["In-Reply-To", recu["Message-Id"]],
            ["X-Originating-IP", "[203.0.113.77]"],
            ["Return-Path", "<alice@example.com>"],
        ],
        subject="RE: Facture de novembre (alice@example.com)",
        **{
            "body-plain": REPONSE_OUTLOOK.format(alias=alias["alias_email"], reelle=ADRESSE_REELLE),
            "body-html": REPONSE_HTML.format(alias=alias["alias_email"], retour=retour),
        },
        fichiers=[
            ("attachment-1", ("invite.ics", INVITATION_ACCEPTEE.format(retour=retour).encode(), "text/calendar")),
            ("attachment-2", ("transfert de alice@example.com.eml", COURRIEL_JOINT.encode(), "message/rfc822")),
            ("attachment-3", ("bon.pdf", b"%PDF-1.7 bon pour accord", "application/pdf")),
        ],
    )
    assert reponse.json() == {"status": "replied"}
    assert len(mailgun.messages) == 1
    sortant = mailgun.messages[0]
    brut = sortant.message

    assert brut["From"] == alias["alias_email"]
    assert brut["To"] == "jean.dupont@exemple.org"
    assert brut["Reply-To"] is None and brut["Cc"] is None and brut["Sender"] is None
    assert brut["Subject"] == f"RE: Facture de novembre ({alias['alias_email']})"
    assert {nom.lower() for nom in brut.keys()} <= ENTETES_AUTORISES_EN_REPONSE
    assert brut["Message-Id"].endswith("@mg.veilix-tests.fr>")

    for fragment in (ADRESSE_REELLE, "alice%40example.com", "alice=40example.com", "CAF0000", "203.0.113.77", "209.85.220.41", "google.com", retour):
        assert not sortant.contient(fragment), fragment
    assert "Alice Martin <" not in str(brut["From"])
    assert alias["alias_email"].encode() in sortant.piece("invite.ics")
    assert b"ORGANIZER;CN=Jean Dupont:mailto:jean.dupont@exemple.org" in sortant.piece("invite.ics")
    assert sortant.piece("bon.pdf") == b"%PDF-1.7 bon pour accord"
    assert sortant.piece(f"transfert de {alias['alias_email']}.eml").count(alias["alias_email"].encode()) == 2
    assert f"À : {alias['alias_email']}" in sortant.data["text"]
    assert db.query(ReplyRoute).count() == 1


def test_invitation_recue_reponse_du_calendrier_dirigee_vers_veilix(client_reel, mailgun, alias):
    invitation = (
        "BEGIN:VCALENDAR\r\nMETHOD:REQUEST\r\nBEGIN:VEVENT\r\nUID:reunion-42@exemple.org\r\n"
        "ORGANIZER;CN=Jean Dupont:mailto:jean.dupont@exemple.org\r\n"
        f"ATTENDEE;RSVP=TRUE:mailto:{alias['alias_email']}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n"
    )
    recevoir(client_reel, alias["alias_email"], fichiers=[("attachment-1", ("invite.ics", invitation.encode(), "text/calendar"))])
    transfere = mailgun.messages[0]
    retour = parseaddr(transfere.message["Reply-To"])[1]
    piece = transfere.piece("invite.ics")
    assert f"ORGANIZER;CN=Jean Dupont:mailto:{retour}".encode() in piece
    assert b"mailto:jean.dupont@exemple.org" not in piece
    assert f"ATTENDEE;RSVP=TRUE:mailto:{alias['alias_email']}".encode() in piece


def test_alias_desactive_message_absorbe_sans_rebond(client_reel, mailgun, alias):
    assert client_reel.patch(f"/alias/{alias['id']}/disable", headers=entetes(alias["cle"])).json()["status"] == "disabled"
    reponse = recevoir(client_reel, alias["alias_email"])
    assert reponse.status_code == 200
    assert reponse.json() == {"status": "ignored"}
    assert mailgun.appels == 0
    assert mailgun.envoyes_a("jean.dupont@exemple.org") == []

    client_reel.patch(f"/alias/{alias['id']}/enable", headers=entetes(alias["cle"]))
    assert recevoir(client_reel, alias["alias_email"]).json() == {"status": "forwarded"}


def test_alias_inexistant_ou_supprime_absorbe_sans_rebond(client_reel, mailgun, alias):
    assert recevoir(client_reel, "0123456789ab@alias.veilix-tests.fr").json() == {"status": "ignored"}
    client_reel.delete(f"/alias/{alias['id']}", headers=entetes(alias["cle"]))
    assert recevoir(client_reel, alias["alias_email"]).json() == {"status": "ignored"}
    assert mailgun.appels == 0


def test_envoi_depuis_l_alias_d_un_autre_compte_refuse(client_reel, mailgun, alias, db):
    recevoir(client_reel, alias["alias_email"])
    retour_d_alice = parseaddr(mailgun.messages[0].message["Reply-To"])[1]
    intrus = creer_alias(client_reel, mailgun, destination="bob@exemple.net")
    recevoir(client_reel, intrus["alias_email"])
    mailgun.vider()

    authentifie_bob = [["X-Mailgun-Spf", "Pass"], ["X-Mailgun-Dkim-Check-Result", "Pass"], ["DKIM-Signature", "v=1; d=exemple.net; b=eA=="]]
    assert recevoir(client_reel, retour_d_alice, expediteur="Bob <bob@exemple.net>", entetes_mailgun=authentifie_bob).json() == {"status": "ignored"}

    usurpation = recevoir(client_reel, retour_d_alice, expediteur="Alice <alice@example.com>", entetes_mailgun=SPF_OK, sender="bob@exemple.net")
    assert usurpation.json() == {"status": "ignored"}

    faux_dkim = [["X-Mailgun-Dkim-Check-Result", "Pass"], ["DKIM-Signature", "v=1; d=exemple.net; b=eA=="]]
    assert recevoir(client_reel, retour_d_alice, expediteur="alice@example.com", entetes_mailgun=faux_dkim, sender="bob@exemple.net").json() == {"status": "ignored"}

    jeton_devine = "reply+" + "0" * 32 + "@mg.veilix-tests.fr"
    assert recevoir(client_reel, jeton_devine, expediteur="bob@exemple.net", entetes_mailgun=authentifie_bob).json() == {"status": "ignored"}
    assert mailgun.appels == 0

    assert client_reel.patch(f"/alias/{alias['id']}/disable", headers=entetes(intrus["cle"])).status_code == 404
    assert client_reel.delete(f"/alias/{alias['id']}", headers=entetes(intrus["cle"])).status_code == 404
    assert alias["alias_email"] not in [a["alias_email"] for a in client_reel.get("/alias", headers=entetes(intrus["cle"])).json()]
    db.expire_all()
    assert db.query(Alias).filter(Alias.id == alias["id"]).one().status == "active"


def test_boucle_entre_deux_alias_veilix_interrompue(client_reel, mailgun, alias):
    autre = creer_alias(client_reel, mailgun, destination="bob@exemple.net")
    cibles = [alias["alias_email"], autre["alias_email"]]
    entetes_courants = SPF_OK
    statuts = []
    for tour in range(8):
        reponse = recevoir(client_reel, cibles[tour % 2], entetes_mailgun=entetes_courants).json()
        statuts.append(reponse["status"])
        if reponse["status"] != "forwarded":
            break
        entetes_courants = SPF_OK + entetes_transmis(mailgun.messages[-1])
    assert statuts == ["forwarded", "forwarded", "forwarded", "ignored"]
    assert [envoi.message["X-Veilix-Hops"] for envoi in mailgun.messages] == ["1", "2", "3"]


def test_chaine_de_relais_trop_longue_refusee(client_reel, mailgun, alias):
    relais = [["Received", f"from relais-{i}.example by relais-{i + 1}.example"] for i in range(31)]
    assert recevoir(client_reel, alias["alias_email"], entetes_mailgun=SPF_OK + relais).json() == {"status": "ignored"}
    assert mailgun.appels == 0


@pytest.mark.parametrize("destination", ["x@alias.veilix-tests.fr", "reply+abc@mg.veilix-tests.fr"])
def test_alias_ne_peut_pas_viser_une_adresse_veilix(client_reel, mailgun, destination):
    cle = inscrire(client_reel)
    assert client_reel.post("/alias", headers=entetes(cle), json={"destination_email": destination}).status_code == 400
