import logging

import pytest

from app.models.alias import Alias
from app.models.key import Key
from app.models.reply_route import ReplyRoute
from app.models.destination import DestinationVerification
from tests.conftest import entetes, inscrire, jeton_de, lien_de_confirmation, signature_mailgun

CORRESPONDANT = "Jean Dupont <jean.dupont@exemple.org>"


@pytest.fixture
def alias_actif(client, emails):
    cle = inscrire(client)
    alias = client.post("/alias", headers=entetes(cle), json={"destination_email": "alice@example.com"}).json()
    client.post("/destination/confirm", json={"token": jeton_de(lien_de_confirmation(emails[0]))})
    emails.clear()
    return {"cle": cle, **alias}


def recevoir(client, destinataire, expediteur=CORRESPONDANT, fichiers=None, **champs):
    data = {
        **signature_mailgun(),
        "recipient": destinataire,
        "from": expediteur,
        "sender": "bounce@exemple.org",
        "subject": "Facture de novembre",
        "body-plain": "Bonjour, voici la facture.",
        "body-html": "<p>Bonjour, voici la facture.</p>",
        **champs,
    }
    return client.post("/email/inbound", data=data, files=fichiers)


def adresse_de_reponse(email):
    return email["h:Reply-To"]


def test_transfert_complet_avec_html_et_pieces_jointes(client, emails, alias_actif):
    fichiers = [
        ("attachment-1", ("facture.pdf", b"%PDF-1.4 contenu", "application/pdf")),
        ("attachment-2", ("photo.png", b"\x89PNG contenu", "image/png")),
    ]
    reponse = recevoir(client, alias_actif["alias_email"], fichiers=fichiers)
    assert reponse.json() == {"status": "forwarded"}
    envoye = emails[0]
    assert envoye["to"] == "alice@example.com"
    assert envoye["from"] == f"Jean Dupont via Veilix <{alias_actif['alias_email']}>"
    assert envoye["subject"] == "Facture de novembre"
    assert envoye["html"] == "<p>Bonjour, voici la facture.</p>"
    assert envoye["o:tracking"] == "no"
    assert adresse_de_reponse(envoye).startswith("reply+") and adresse_de_reponse(envoye).endswith("@mg.veilix-tests.fr")
    assert [nom for _, (nom, _, _) in envoye["_files"]] == ["facture.pdf", "photo.png"]
    assert envoye["_files"][0][1][1] == b"%PDF-1.4 contenu"


def test_correspondant_stocke_chiffre_et_adresse_de_reponse_stable(client, emails, alias_actif, db):
    recevoir(client, alias_actif["alias_email"])
    recevoir(client, alias_actif["alias_email"])
    assert adresse_de_reponse(emails[0]) == adresse_de_reponse(emails[1])
    route = db.query(ReplyRoute).one()
    assert route.sender_email.startswith("v2:")
    assert "jean" not in route.sender_email
    jeton = adresse_de_reponse(emails[0]).split("+", 1)[1].split("@", 1)[0]
    assert jeton not in route.token_hash


def test_adresses_de_reponse_differentes_par_correspondant(client, emails, alias_actif):
    recevoir(client, alias_actif["alias_email"])
    recevoir(client, alias_actif["alias_email"], expediteur="paul@exemple.org")
    assert adresse_de_reponse(emails[0]) != adresse_de_reponse(emails[1])


def test_reponse_du_proprietaire_part_depuis_l_alias(client, emails, alias_actif):
    recevoir(client, alias_actif["alias_email"])
    retour = adresse_de_reponse(emails[0])
    fichiers = [("attachment-1", ("signe.pdf", b"%PDF signe", "application/pdf"))]
    reponse = recevoir(client, retour, expediteur="Alice <Alice@Example.com>", fichiers=fichiers, subject="Re: Facture")
    assert reponse.json() == {"status": "replied"}
    envoye = emails[1]
    assert envoye["from"] == alias_actif["alias_email"]
    assert envoye["to"] == "jean.dupont@exemple.org"
    assert envoye["subject"] == "Re: Facture"
    assert "h:Reply-To" not in envoye
    assert "alice@example.com" not in str({k: v for k, v in envoye.items() if k != "_files"}).lower()
    assert [nom for _, (nom, _, _) in envoye["_files"]] == ["signe.pdf"]


def test_reponse_d_un_inconnu_refusee(client, emails, alias_actif):
    recevoir(client, alias_actif["alias_email"])
    retour = adresse_de_reponse(emails[0])
    reponse = recevoir(client, retour, expediteur="pirate@exemple.org")
    assert reponse.json() == {"status": "ignored"}
    assert len(emails) == 1


@pytest.mark.parametrize("jeton", ["0" * 32, "z" * 32, "abc", "", "0" * 31 + "G"])
def test_adresse_de_reponse_inconnue_ou_invalide_ignoree(client, emails, alias_actif, jeton):
    reponse = recevoir(client, f"reply+{jeton}@mg.veilix-tests.fr", expediteur="alice@example.com")
    assert reponse.json() == {"status": "ignored"}
    assert emails == []


def test_reponse_bloquee_si_alias_desactive(client, emails, alias_actif):
    recevoir(client, alias_actif["alias_email"])
    retour = adresse_de_reponse(emails[0])
    client.patch(f"/alias/{alias_actif['id']}/disable", headers=entetes(alias_actif["cle"]))
    assert recevoir(client, retour, expediteur="alice@example.com").json() == {"status": "ignored"}
    assert len(emails) == 1


def test_cle_suspendue_ne_recoit_ni_n_envoie_plus(client, emails, alias_actif, db):
    recevoir(client, alias_actif["alias_email"])
    retour = adresse_de_reponse(emails[0])
    db.query(Key).update({Key.status: "suspended"})
    db.commit()
    assert recevoir(client, alias_actif["alias_email"]).json() == {"status": "ignored"}
    assert recevoir(client, retour, expediteur="alice@example.com").json() == {"status": "ignored"}
    assert len(emails) == 1


def test_destination_non_confirmee_jamais_servie_meme_si_alias_actif(client, emails, alias_actif, db):
    db.query(DestinationVerification).update({DestinationVerification.verified_at: None})
    db.commit()
    assert recevoir(client, alias_actif["alias_email"]).json() == {"status": "ignored"}
    assert emails == []


def test_suppression_de_l_alias_efface_les_routes_de_reponse(client, emails, alias_actif, db):
    recevoir(client, alias_actif["alias_email"])
    assert db.query(ReplyRoute).count() == 1
    client.delete(f"/alias/{alias_actif['id']}", headers=entetes(alias_actif["cle"]))
    db.expire_all()
    assert db.query(ReplyRoute).count() == 0
    retour = adresse_de_reponse(emails[0])
    assert recevoir(client, retour, expediteur="alice@example.com").json() == {"status": "ignored"}


def test_message_sans_expediteur_ignore(client, emails, alias_actif):
    assert recevoir(client, alias_actif["alias_email"], expediteur="", sender="").json() == {"status": "ignored"}
    assert emails == []


def test_pieces_jointes_trop_lourdes_remplacees_par_une_note(client, emails, alias_actif):
    gros = b"x" * (11 * 1024 * 1024)
    fichiers = [("attachment-1", ("a.bin", gros, "application/octet-stream")), ("attachment-2", ("b.bin", gros, "application/octet-stream"))]
    assert recevoir(client, alias_actif["alias_email"], fichiers=fichiers).json() == {"status": "forwarded"}
    assert emails[0]["_files"] == []
    assert "Pièces jointes non transférées" in emails[0]["text"]
    assert "Pièces jointes non transférées" in emails[0]["html"]


def test_nombre_de_pieces_jointes_limite(client, emails, alias_actif):
    fichiers = [(f"attachment-{i}", (f"f{i}.txt", b"contenu", "text/plain")) for i in range(25)]
    recevoir(client, alias_actif["alias_email"], fichiers=fichiers)
    assert len(emails[0]["_files"]) == 20


def test_message_trop_volumineux_refuse_avant_lecture(client, emails, alias_actif):
    reponse = client.post("/email/inbound", content=b"x", headers={"content-length": str(41 * 1024 * 1024), "content-type": "application/x-www-form-urlencoded"})
    assert reponse.status_code == 413


def test_fichiers_non_lus_si_signature_fausse(client, emails, alias_actif, monkeypatch):
    from app.routes import email as route

    lus = []
    original = route._read_attachments

    async def espion(uploads):
        lus.append(len(uploads))
        return await original(uploads)

    monkeypatch.setattr(route, "_read_attachments", espion)
    fichiers = [("attachment-1", ("a.pdf", b"%PDF", "application/pdf"))]
    reponse = recevoir(client, alias_actif["alias_email"], fichiers=fichiers, signature="0" * 64)
    assert reponse.status_code == 403
    assert lus == []


@pytest.mark.parametrize("destination", ["boucle@alias.veilix-tests.fr", "x@MG.veilix-tests.fr"])
def test_adresse_veilix_refusee_comme_destination(client, destination):
    cle = inscrire(client)
    reponse = client.post("/alias", headers=entetes(cle), json={"destination_email": destination})
    assert reponse.status_code == 400


def test_aucune_adresse_dans_les_journaux(client, emails, alias_actif, caplog):
    with caplog.at_level(logging.DEBUG):
        recevoir(client, alias_actif["alias_email"])
        retour = adresse_de_reponse(emails[0])
        recevoir(client, retour, expediteur="alice@example.com")
        recevoir(client, retour, expediteur="pirate@exemple.org")
    journal = caplog.text.lower()
    for fragment in ("jean.dupont", "alice@", "pirate@", alias_actif["alias_email"].split("@")[0], "reply+"):
        assert fragment not in journal


def test_sujet_et_nom_nettoyes_des_retours_a_la_ligne(client, emails, alias_actif):
    recevoir(client, alias_actif["alias_email"], expediteur="Jean\r\nBcc: x@y.z <jean@exemple.org>", subject="Ligne 1\r\nBcc: cible@exemple.org")
    envoye = emails[0]
    assert "\n" not in envoye["subject"] and "\r" not in envoye["subject"]
    assert "\n" not in envoye["from"] and "\r" not in envoye["from"]
