from email.utils import parseaddr
from urllib.parse import urlencode

import httpx
import pytest
from sqlalchemy import text

from app.core import config, dmarc, mailgun as jetons
from app.db.session import engine
from app.models.reply_route import ReplyRoute
from app.services import privacy, sender_auth
from tests.conftest import signature_mailgun
from tests.outils_email import ADRESSE_REELLE, SPF_OK, creer_alias, recevoir

IDENTIFIANT = [["Message-Id", "<commande-7781@exemple.org>"]]
AUTHENTIFIE_ALICE = [["X-Mailgun-Spf", "Pass"]]


@pytest.fixture
def alias(client_reel, mailgun):
    return creer_alias(client_reel, mailgun)


def adresse_de_retour(client, mailgun, alias):
    recevoir(client, alias["alias_email"])
    retour = parseaddr(mailgun.messages[-1].message["Reply-To"])[1]
    mailgun.vider()
    return retour


def repondre(client, retour, entetes_mailgun=AUTHENTIFIE_ALICE, **champs):
    return recevoir(client, retour, expediteur="Alice <alice@example.com>", entetes_mailgun=entetes_mailgun, **champs)


def vieillir(table, colonne, minutes):
    with engine.begin() as conn:
        conn.execute(text(f"UPDATE {table} SET {colonne} = {colonne} - make_interval(mins => :minutes)"), {"minutes": minutes})


def test_panne_du_relais_sortant_puis_reprise_sans_perte_ni_doublon(client_reel, mailgun, alias):
    signature = signature_mailgun()
    mailgun.pannes = [httpx.ConnectTimeout("délai dépassé"), 503, 429, 401]
    for _ in range(4):
        tentative = recevoir(client_reel, alias["alias_email"], signature=signature, entetes_mailgun=SPF_OK + IDENTIFIANT)
        assert tentative.status_code == 502
    assert mailgun.messages == []

    reprise = recevoir(client_reel, alias["alias_email"], signature=signature, entetes_mailgun=SPF_OK + IDENTIFIANT)
    assert reprise.json() == {"status": "forwarded"}
    assert len(mailgun.messages) == 1

    assert recevoir(client_reel, alias["alias_email"], signature=signature, entetes_mailgun=SPF_OK + IDENTIFIANT).status_code == 403
    nouvelle_livraison = recevoir(client_reel, alias["alias_email"], entetes_mailgun=SPF_OK + IDENTIFIANT)
    assert nouvelle_livraison.json() == {"status": "duplicate"}
    assert len(mailgun.messages) == 1
    assert mailgun.appels == 5


def test_reprise_apres_arret_brutal_du_worker(client_reel, mailgun, alias):
    signature = signature_mailgun()
    assert jetons.claim_token(signature["token"]) is True

    en_cours = recevoir(client_reel, alias["alias_email"], signature=signature)
    assert en_cours.status_code == 503
    assert int(en_cours.headers["Retry-After"]) > 0
    assert mailgun.appels == 0

    vieillir("webhook_tokens", "claimed_at", 6)
    assert recevoir(client_reel, alias["alias_email"], signature=signature).json() == {"status": "forwarded"}
    assert len(mailgun.messages) == 1
    assert recevoir(client_reel, alias["alias_email"], signature=signature).status_code == 403


def test_message_en_cours_par_un_autre_worker_puis_bail_expire(client_reel, mailgun, alias):
    cle = jetons.message_key("<commande-7781@exemple.org>", alias["alias_email"], "jean.dupont@exemple.org")
    assert jetons.claim_message(cle) == jetons.CLAIMED

    signature = signature_mailgun()
    concurrent = recevoir(client_reel, alias["alias_email"], signature=signature, entetes_mailgun=SPF_OK + IDENTIFIANT)
    assert concurrent.status_code == 503
    assert mailgun.appels == 0

    vieillir("inbound_messages", "claimed_at", 6)
    assert recevoir(client_reel, alias["alias_email"], signature=signature, entetes_mailgun=SPF_OK + IDENTIFIANT).json() == {"status": "forwarded"}
    assert len(mailgun.messages) == 1


def test_identifiant_sortant_stable_pour_dedoublonner_chez_le_destinataire(client_reel, mailgun, alias):
    recevoir(client_reel, alias["alias_email"], entetes_mailgun=SPF_OK + IDENTIFIANT)
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE inbound_messages, webhook_tokens"))
    recevoir(client_reel, alias["alias_email"], entetes_mailgun=SPF_OK + IDENTIFIANT)
    recevoir(client_reel, alias["alias_email"], entetes_mailgun=SPF_OK + [["Message-Id", "<autre@exemple.org>"]])
    identifiants = [envoi.message["Message-Id"] for envoi in mailgun.messages]
    assert identifiants[0] == identifiants[1] != identifiants[2]
    assert "commande-7781" not in identifiants[0]


def test_meme_identifiant_pour_deux_alias_traite_deux_fois(client_reel, mailgun, alias):
    autre = creer_alias(client_reel, mailgun, cle=alias["cle"])
    assert recevoir(client_reel, alias["alias_email"], entetes_mailgun=SPF_OK + IDENTIFIANT).json() == {"status": "forwarded"}
    assert recevoir(client_reel, autre["alias_email"], entetes_mailgun=SPF_OK + IDENTIFIANT).json() == {"status": "forwarded"}
    assert len(mailgun.messages) == 2


def test_refus_definitif_avec_pieces_jointes_renvoye_sans_elles(client_reel, mailgun, alias):
    mailgun.pannes = [413]
    fichiers = [("attachment-1", ("archive.zip", b"PK contenu", "application/zip"))]
    assert recevoir(client_reel, alias["alias_email"], fichiers=fichiers).json() == {"status": "forwarded"}
    assert mailgun.appels == 2
    envoye = mailgun.messages[0]
    assert envoye.files == []
    assert "refusées par le service d'envoi" in envoye.data["text"]
    assert "refusées par le service d'envoi" in envoye.data["html"]


def test_refus_definitif_abandonne_sans_boucle_de_reprise(client_reel, mailgun, alias):
    signature = signature_mailgun()
    mailgun.pannes = [400]
    reponse = recevoir(client_reel, alias["alias_email"], signature=signature)
    assert reponse.status_code == 406
    assert reponse.json() == {"status": "rejected"}
    assert recevoir(client_reel, alias["alias_email"], signature=signature).status_code == 403
    assert mailgun.appels == 1


def test_corps_sans_longueur_annoncee_plafonne_pendant_la_lecture(client_reel, mailgun, alias, monkeypatch):
    from app.routes import email as route

    monkeypatch.setattr(route, "MAX_BODY_BYTES", 2048)

    def flux():
        for _ in range(8):
            yield b"x" * 1024

    reponse = client_reel.post("/email/inbound", content=flux(), headers={"content-type": "application/x-www-form-urlencoded"})
    assert reponse.status_code == 413
    assert mailgun.appels == 0


def test_signatures_invalides_en_rafale_bloquent_l_adresse(client_reel, mailgun, alias, monkeypatch):
    monkeypatch.setattr(config, "WEBHOOK_BAD_SIGNATURES_PER_HOUR", 3)
    fausse = {"timestamp": "1", "token": "x", "signature": "0" * 64}
    statuts = [recevoir(client_reel, alias["alias_email"], signature=fausse).status_code for _ in range(4)]
    assert statuts == [403, 403, 403, 429]
    assert recevoir(client_reel, alias["alias_email"]).status_code == 429
    assert client_reel.post("/email/events", json={"signature": signature_mailgun(), "event-data": {}}).status_code == 429
    assert mailgun.appels == 0


def test_message_sans_texte_transfere_avec_ses_pieces(client_reel, mailgun, alias):
    chiffre = b"-----BEGIN PGP MESSAGE-----\n\nhQEMA7\n-----END PGP MESSAGE-----\n"
    fichiers = [
        ("attachment-1", ("PGPMIME version identification", b"Version: 1\n", "application/pgp-encrypted")),
        ("attachment-2", ("encrypted.asc", chiffre, "application/octet-stream")),
    ]
    reponse = recevoir(client_reel, alias["alias_email"], fichiers=fichiers, **{"body-plain": "", "body-html": ""})
    assert reponse.json() == {"status": "forwarded"}
    envoye = mailgun.messages[0]
    assert "son contenu se trouve en pièce jointe" in envoye.data["text"]
    assert envoye.piece("encrypted.asc") == chiffre
    assert "html" not in envoye.data


def test_message_totalement_vide_transfere_quand_meme(client_reel, mailgun, alias):
    assert recevoir(client_reel, alias["alias_email"], **{"body-plain": "   ", "body-html": ""}).json() == {"status": "forwarded"}
    assert mailgun.messages[0].data["text"].strip()


def test_signature_smime_et_binaire_transmis_a_l_octet_pres(client_reel, mailgun, alias):
    signature_p7s = bytes(range(256)) * 8
    fichiers = [("attachment-1", ("smime.p7s", signature_p7s, "application/pkcs7-signature"))]
    recevoir(client_reel, alias["alias_email"], fichiers=fichiers)
    assert mailgun.messages[0].piece("smime.p7s") == signature_p7s

    retour = parseaddr(mailgun.messages[0].message["Reply-To"])[1]
    mailgun.vider()
    repondre(client_reel, retour, fichiers=fichiers)
    assert mailgun.messages[0].piece("smime.p7s") == signature_p7s


def test_encodages_exotiques_et_caracteres_de_controle(client_reel, mailgun, alias):
    sujet = "Re‮: \u0001facture\u0000 été \U0001f4ce مرحبا\tfin"
    reponse = recevoir(client_reel, alias["alias_email"], expediteur="‮Jean\u0007 Dupont <jean.dupont@exemple.org>", subject=sujet)
    assert reponse.json() == {"status": "forwarded"}
    envoye = mailgun.messages[0]
    assert envoye.data["subject"] == "Re: facture été \U0001f4ce مرحبا fin"
    assert envoye.data["from"].startswith("Jean Dupont via Veilix")


def test_corps_non_utf8_ne_fait_pas_planter_le_traitement(client_reel, mailgun, alias):
    champs = {
        **signature_mailgun(),
        "recipient": alias["alias_email"],
        "from": "jean.dupont@exemple.org",
        "sender": "jean.dupont@exemple.org",
        "message-headers": "[]",
        "subject": "café crème",
        "body-plain": "déjà vu à Noël",
    }
    corps = urlencode(champs, encoding="latin-1").encode("ascii")
    reponse = client_reel.post("/email/inbound", content=corps, headers={"content-type": "application/x-www-form-urlencoded"})
    assert reponse.status_code == 200
    assert reponse.json() == {"status": "forwarded"}
    assert len(mailgun.messages) == 1


def test_nom_de_piece_jointe_assaini(client_reel, mailgun, alias):
    fichiers = [("attachment-1", ("..\\..\\secrets/../rapport.pdf", b"%PDF", "application/pdf"))]
    recevoir(client_reel, alias["alias_email"], fichiers=fichiers)
    assert [nom for _, (nom, _, _) in mailgun.messages[0].files] == ["rapport.pdf"]
    assert privacy.safe_filename("\u0000‮", "piece-1") == "piece-1"
    assert len(privacy.safe_filename("a" * 500 + ".txt", "piece-1")) == 200


def test_quota_de_reponses_differe_puis_reprend(client_reel, mailgun, alias, monkeypatch):
    monkeypatch.setattr(config, "REPLY_LIMIT_PER_KEY_HOUR", 2)
    retour = adresse_de_retour(client_reel, mailgun, alias)
    assert repondre(client_reel, retour).json() == {"status": "replied"}
    assert repondre(client_reel, retour).json() == {"status": "replied"}

    signature = signature_mailgun()
    differe = repondre(client_reel, retour, signature=signature)
    assert differe.status_code == 503
    assert int(differe.headers["Retry-After"]) >= 60
    assert len(mailgun.messages) == 2

    vieillir("rate_limits", "window_start", 61)
    assert repondre(client_reel, retour, signature=signature).json() == {"status": "replied"}
    assert len(mailgun.messages) == 3


def test_quota_quotidien_de_reponses_par_cle(client_reel, mailgun, alias, monkeypatch):
    monkeypatch.setattr(config, "REPLY_LIMIT_PER_KEY_DAY", 1)
    autre = creer_alias(client_reel, mailgun, cle=alias["cle"])
    premier = adresse_de_retour(client_reel, mailgun, alias)
    second = adresse_de_retour(client_reel, mailgun, autre)
    assert repondre(client_reel, premier).json() == {"status": "replied"}
    assert repondre(client_reel, second).status_code == 503


def test_inondation_d_un_alias_differee(client_reel, mailgun, alias, monkeypatch):
    monkeypatch.setattr(config, "FORWARD_LIMIT_PER_ALIAS_HOUR", 3)
    statuts = [recevoir(client_reel, alias["alias_email"]).status_code for _ in range(5)]
    assert statuts == [200, 200, 200, 503, 503]
    assert len(mailgun.messages) == 3
    autre = creer_alias(client_reel, mailgun, cle=alias["cle"])
    assert recevoir(client_reel, autre["alias_email"]).status_code == 200


@pytest.mark.parametrize("entetes_auto", [
    [["Auto-Submitted", "auto-replied"]],
    [["Auto-Submitted", "auto-generated; reason=oof"]],
    [["X-Autoreply", "yes"]],
    [["Precedence", "bulk"]],
    [["X-Auto-Response-Suppress", "All"]],
])
def test_reponse_automatique_du_proprietaire_non_relayee(client_reel, mailgun, alias, entetes_auto):
    retour = adresse_de_retour(client_reel, mailgun, alias)
    assert repondre(client_reel, retour, entetes_mailgun=AUTHENTIFIE_ALICE + entetes_auto).json() == {"status": "ignored"}
    assert mailgun.appels == 0
    assert repondre(client_reel, retour, entetes_mailgun=AUTHENTIFIE_ALICE + [["Auto-Submitted", "no"]]).json() == {"status": "replied"}


def test_transfert_demande_de_ne_pas_repondre_automatiquement(client_reel, mailgun, alias):
    recevoir(client_reel, alias["alias_email"], entetes_mailgun=SPF_OK + [["Auto-Submitted", "auto-replied"]])
    assert mailgun.messages[0].message["X-Auto-Response-Suppress"] == "OOF, AutoReply"


def test_indesirable_certain_abandonne_et_douteux_etiquete(client_reel, mailgun, alias):
    certain = SPF_OK + [["X-Mailgun-Sflag", "Yes"], ["X-Mailgun-Sscore", "12.4"]]
    assert recevoir(client_reel, alias["alias_email"], entetes_mailgun=certain).json() == {"status": "ignored"}
    assert mailgun.appels == 0

    douteux = SPF_OK + [["X-Mailgun-Sflag", "Yes"], ["X-Mailgun-Sscore", "5.6"]]
    assert recevoir(client_reel, alias["alias_email"], entetes_mailgun=douteux).json() == {"status": "forwarded"}
    assert mailgun.messages[0].data["subject"] == "[Spam ?] Facture de novembre"

    sain = SPF_OK + [["X-Mailgun-Sflag", "No"], ["X-Mailgun-Sscore", "0.1"]]
    recevoir(client_reel, alias["alias_email"], entetes_mailgun=sain)
    assert mailgun.messages[1].data["subject"] == "Facture de novembre"


def test_verdict_antispam_injecte_par_l_expediteur_sans_effet(client_reel, mailgun, alias):
    injecte = SPF_OK + [["X-Mailgun-Sflag", "No"], ["X-Mailgun-Sscore", "-50"], ["X-Mailgun-Sflag", "Yes"], ["X-Mailgun-Sscore", "15"]]
    assert recevoir(client_reel, alias["alias_email"], entetes_mailgun=injecte).json() == {"status": "ignored"}


def usurpation(client, alias, domaine, entetes_mailgun):
    return recevoir(
        client,
        alias["alias_email"],
        expediteur=f"Service client <securite@{domaine}>",
        sender="rebond@attaquant.example",
        entetes_mailgun=entetes_mailgun,
    )


def test_usurpation_d_un_domaine_dmarc_reject_non_blanchie(client_reel, mailgun, alias, dns_hors_ligne, db):
    dns_hors_ligne["banque.example"] = "reject"
    assert usurpation(client_reel, alias, "banque.example", SPF_OK).json() == {"status": "ignored"}
    assert usurpation(client_reel, alias, "alertes.banque.example", SPF_OK).json() == {"status": "ignored"}
    etranger = [["X-Mailgun-Spf", "Pass"], ["X-Mailgun-Dkim-Check-Result", "Pass"], ["DKIM-Signature", "v=1; d=attaquant.example; b=eA=="]]
    assert usurpation(client_reel, alias, "banque.example", etranger).json() == {"status": "ignored"}
    assert mailgun.appels == 0
    assert db.query(ReplyRoute).count() == 0


def test_message_legitime_d_un_domaine_dmarc_reject_transfere(client_reel, mailgun, alias, dns_hors_ligne):
    dns_hors_ligne["banque.example"] = "reject"
    double_signature = [
        ["X-Mailgun-Spf", "Pass"],
        ["X-Mailgun-Dkim-Check-Result", "Pass"],
        ["DKIM-Signature", "v=1; d=banque.example; s=a; b=eA=="],
        ["DKIM-Signature", "v=1; d=prestataire-envoi.example; s=b; b=eQ=="],
    ]
    assert usurpation(client_reel, alias, "banque.example", double_signature).json() == {"status": "forwarded"}
    aligne = recevoir(client_reel, alias["alias_email"], expediteur="securite@banque.example", sender="rebond@mail.banque.example")
    assert aligne.json() == {"status": "forwarded"}
    assert all("[" not in envoi.data["subject"] for envoi in mailgun.messages)


def test_domaine_dmarc_quarantine_etiquete(client_reel, mailgun, alias, dns_hors_ligne):
    dns_hors_ligne["boutique.example"] = "quarantine"
    assert usurpation(client_reel, alias, "boutique.example", SPF_OK).json() == {"status": "forwarded"}
    assert mailgun.messages[0].data["subject"] == "[Expéditeur non vérifié] Facture de novembre"


def test_dmarc_inapplicable_sans_verdict_ou_sans_dns(client_reel, mailgun, alias, dns_hors_ligne, monkeypatch):
    dns_hors_ligne["banque.example"] = "reject"
    assert usurpation(client_reel, alias, "banque.example", []).json() == {"status": "forwarded"}

    monkeypatch.setattr(dmarc, "_query", lambda nom: None)
    dmarc.clear_cache()
    assert usurpation(client_reel, alias, "banque.example", SPF_OK).json() == {"status": "forwarded"}

    monkeypatch.setattr(config, "DMARC_ENFORCEMENT", False)
    assert usurpation(client_reel, alias, "banque.example", SPF_OK).json() == {"status": "forwarded"}


def test_lecture_des_politiques_dmarc(monkeypatch):
    zone = {
        "_dmarc.exemple.org": ["v=spf1 -all", "v=DMARC1; p=reject; sp=quarantine; rua=mailto:x@exemple.org"],
        "_dmarc.strict.exemple.org": ["v=DMARC1;p=none"],
        "_dmarc.double.example": ["v=DMARC1; p=reject", "v=DMARC1; p=none"],
        "_dmarc.example": ["v=DMARC1; p=reject; psd=y"],
    }
    appels = []

    def repondre_dns(nom):
        appels.append(nom)
        return zone.get(nom, [])

    monkeypatch.setattr(dmarc, "_query", repondre_dns)
    dmarc.clear_cache()
    assert dmarc.policy("exemple.org") == "reject"
    assert dmarc.policy("a.b.exemple.org") == "quarantine"
    assert dmarc.policy("strict.exemple.org") == "none"
    assert dmarc.policy("double.example") is None
    assert dmarc.policy("inconnu.test") is None
    assert dmarc.policy("localhost") is None
    avant = len(appels)
    assert dmarc.policy("exemple.org") == "reject"
    assert len(appels) == avant


def test_route_de_reponse_reservee_aux_expediteurs_authentifies_si_active(client_reel, mailgun, alias, monkeypatch, db):
    monkeypatch.setattr(config, "REPLY_REQUIRE_AUTHENTICATED_SENDER", True)
    recevoir(client_reel, alias["alias_email"], entetes_mailgun=[["X-Mailgun-Spf", "SoftFail"]])
    douteux = mailgun.messages[0]
    assert douteux.message["Reply-To"] is None
    assert "réponse via l'alias est désactivée" in douteux.data["text"]
    assert db.query(ReplyRoute).count() == 0

    recevoir(client_reel, alias["alias_email"])
    assert mailgun.messages[1].message["Reply-To"] is not None
    assert db.query(ReplyRoute).count() == 1


def test_fabrication_d_une_route_vers_une_victime_bornee_par_les_quotas(client_reel, mailgun, alias, monkeypatch):
    monkeypatch.setattr(config, "REPLY_LIMIT_PER_KEY_HOUR", 1)
    retours = []
    for victime in ("victime-1@cible.example", "victime-2@cible.example"):
        recevoir(client_reel, alias["alias_email"], expediteur=victime, sender="rebond@attaquant.example", entetes_mailgun=[["X-Mailgun-Spf", "SoftFail"]])
        retours.append(parseaddr(mailgun.messages[-1].message["Reply-To"])[1])
    mailgun.vider()
    assert repondre(client_reel, retours[0]).json() == {"status": "replied"}
    assert repondre(client_reel, retours[1]).status_code == 503
    assert [envoi.data["to"] for envoi in mailgun.messages] == ["victime-1@cible.example"]


def test_nettoyage_de_l_adresse_reelle_insensible_a_la_casse_et_aux_encodages():
    nettoyeur = privacy.Scrubber({ADRESSE_REELLE: "a1@alias.veilix-tests.fr"})
    assert nettoyeur.text("ALICE@Example.COM, alice%40example.com, alice=40example.com") == ", ".join(["a1@alias.veilix-tests.fr"] * 3)
    assert nettoyeur.text("malice@example.com.evil") == "ma1@alias.veilix-tests.fr.evil"
    assert nettoyeur.content(b"X-To: <Alice@example.com>") == b"X-To: <a1@alias.veilix-tests.fr>"
    assert nettoyeur.text("") == ""
    assert privacy.Scrubber({}).text("alice@example.com") == "alice@example.com"


def test_boucle_comptee_meme_avec_un_en_tete_forge():
    assert sender_auth.hops([["X-Veilix-Hops", "2"], ["x-veilix-hops", "abc"]]) == 2
    assert sender_auth.hops([["X-Veilix-Hops", "999999999999"]]) == 99
    assert sender_auth.hops([]) == 0
