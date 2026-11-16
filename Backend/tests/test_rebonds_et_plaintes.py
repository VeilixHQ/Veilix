import logging
from email.utils import parseaddr

import pytest
from sqlalchemy import text

from app.db.session import engine
from app.models.alias import Alias
from app.models.delivery import DestinationHealth
from app.models.key import Key
from app.models.reply_route import ReplyRoute
from tests.conftest import entetes, jeton_de, lien_de_confirmation, signature_mailgun
from tests.outils_email import ADRESSE_REELLE, creer_alias, evenement, recevoir

CORRESPONDANT = "jean.dupont@exemple.org"


@pytest.fixture
def alias(client_reel, mailgun):
    return creer_alias(client_reel, mailgun)


def transfert_de(alias):
    return f"Jean Dupont via Veilix <{alias['alias_email']}>"


def statut_alias(db, alias):
    db.expire_all()
    return db.query(Alias).filter(Alias.id == alias["id"]).one().status


def sante(db):
    db.expire_all()
    return db.query(DestinationHealth).one()


def test_rebond_definitif_suspend_la_destination_sans_prevenir_l_expediteur(client_reel, mailgun, alias, db):
    second = creer_alias(client_reel, mailgun, cle=alias["cle"])
    reponse = evenement(client_reel, "failed", ADRESSE_REELLE, transfert_de(alias), gravite="permanent", raison="bounce")
    assert reponse.json() == {"status": "suspended"}
    assert statut_alias(db, alias) == "pending"
    assert statut_alias(db, second) == "pending"
    assert sante(db).state == "suspended" and sante(db).reason == "hard_bounce"
    assert mailgun.appels == 0

    assert recevoir(client_reel, alias["alias_email"]).json() == {"status": "ignored"}
    assert mailgun.envoyes_a(CORRESPONDANT) == []
    assert mailgun.appels == 0


def test_destination_suspendue_reconfirmee_apres_purge_de_la_liste_de_suppression(client_reel, mailgun, alias, db):
    evenement(client_reel, "failed", ADRESSE_REELLE, transfert_de(alias), gravite="permanent", raison="suppress-bounce")
    with engine.begin() as conn:
        conn.execute(text("UPDATE destination_verifications SET last_sent_at = last_sent_at - interval '3 minutes'"))
    assert client_reel.post(f"/alias/{alias['id']}/resend-confirmation", headers=entetes(alias["cle"])).status_code == 200
    assert mailgun.suppressions == ["bounces/alice%40example.com", "complaints/alice%40example.com", "unsubscribes/alice%40example.com"]
    lien = lien_de_confirmation(mailgun.envoyes_a(ADRESSE_REELLE)[-1].data)
    assert client_reel.post("/destination/confirm", json={"token": jeton_de(lien)}).json()["activated_aliases"] == 1
    assert statut_alias(db, alias) == "active"
    assert sante(db).state == "healthy" and sante(db).reason is None
    mailgun.vider()
    assert recevoir(client_reel, alias["alias_email"]).json() == {"status": "forwarded"}


def test_echecs_temporaires_degradent_puis_suspendent_apres_72_heures(client_reel, mailgun, alias, db):
    for _ in range(6):
        reponse = evenement(client_reel, "failed", ADRESSE_REELLE, transfert_de(alias), gravite="temporary", raison="generic")
        assert reponse.json() == {"status": "degraded"}
    assert statut_alias(db, alias) == "active"
    assert sante(db).soft_failures == 6
    assert recevoir(client_reel, alias["alias_email"]).json() == {"status": "forwarded"}

    with engine.begin() as conn:
        conn.execute(text("UPDATE destination_health SET first_soft_failure_at = first_soft_failure_at - interval '73 hours'"))
    expire = evenement(client_reel, "failed", ADRESSE_REELLE, transfert_de(alias), gravite="permanent", raison="old")
    assert expire.json() == {"status": "suspended"}
    assert sante(db).reason == "soft_bounces"
    assert statut_alias(db, alias) == "pending"


def test_remise_reussie_efface_les_echecs_temporaires(client_reel, mailgun, alias, db):
    for _ in range(3):
        evenement(client_reel, "failed", ADRESSE_REELLE, transfert_de(alias), gravite="temporary", raison="generic")
    assert sante(db).state == "degraded"
    assert evenement(client_reel, "delivered", ADRESSE_REELLE, transfert_de(alias)).json() == {"status": "delivered"}
    assert sante(db).state == "healthy" and sante(db).soft_failures == 0
    assert statut_alias(db, alias) == "active"


def test_rejet_pour_contenu_ne_suspend_pas_la_destination(client_reel, mailgun, alias, db):
    reponse = evenement(client_reel, "failed", ADRESSE_REELLE, transfert_de(alias), gravite="permanent", raison="espblock")
    assert reponse.json() == {"status": "degraded"}
    assert statut_alias(db, alias) == "active"


def test_plainte_desactive_l_alias_concerne_et_previent_le_proprietaire(client_reel, mailgun, alias, db):
    second = creer_alias(client_reel, mailgun, cle=alias["cle"])
    reponse = evenement(client_reel, "complained", ADRESSE_REELLE, transfert_de(alias))
    assert reponse.json() == {"status": "alias_disabled"}
    assert statut_alias(db, alias) == "disabled"
    assert statut_alias(db, second) == "active"
    assert mailgun.suppressions == ["complaints/alice%40example.com"]
    avis = mailgun.envoyes_a(ADRESSE_REELLE)
    assert len(avis) == 1
    assert alias["alias_email"] in avis[0].data["text"]
    assert mailgun.envoyes_a(CORRESPONDANT) == []

    evenement(client_reel, "failed", ADRESSE_REELLE, transfert_de(second), gravite="permanent", raison="suppress-complaint")
    assert statut_alias(db, second) == "disabled"
    assert len(mailgun.envoyes_a(ADRESSE_REELLE)) == 1


def test_plaintes_repetees_suspendent_la_destination(client_reel, mailgun, alias, db):
    autres = [creer_alias(client_reel, mailgun, cle=alias["cle"]) for _ in range(3)]
    for cible in (alias, autres[0]):
        evenement(client_reel, "complained", ADRESSE_REELLE, transfert_de(cible))
    assert statut_alias(db, autres[2]) == "active"
    assert evenement(client_reel, "complained", ADRESSE_REELLE, transfert_de(autres[1])).json() == {"status": "suspended"}
    assert statut_alias(db, autres[2]) == "pending"
    assert sante(db).reason == "complaint"


def test_reponse_non_remise_signalee_au_seul_proprietaire(client_reel, mailgun, alias, db):
    reponse = evenement(client_reel, "failed", CORRESPONDANT, alias["alias_email"], gravite="permanent", raison="bounce")
    assert reponse.json() == {"status": "owner_notified"}
    assert [parseaddr(envoi.data["to"])[1] for envoi in mailgun.messages] == [ADRESSE_REELLE]
    avis = mailgun.messages[0]
    assert CORRESPONDANT in avis.data["text"] and alias["alias_email"] in avis.data["text"]
    assert avis.data["from"].startswith("Veilix <noreply@")
    assert statut_alias(db, alias) == "active"
    assert db.query(DestinationHealth).count() == 0

    assert evenement(client_reel, "failed", CORRESPONDANT, alias["alias_email"], gravite="temporary", raison="generic").json() == {"status": "ignored"}
    assert len(mailgun.messages) == 1


def test_avis_de_non_remise_plafonnes(client_reel, mailgun, alias):
    statuts = [
        evenement(client_reel, "failed", f"inconnu-{i}@exemple.org", alias["alias_email"], gravite="permanent", raison="bounce").json()["status"]
        for i in range(7)
    ]
    assert statuts == ["owner_notified"] * 5 + ["ignored"] * 2
    assert len(mailgun.messages) == 5


def test_plainte_d_un_correspondant_retire_la_route_puis_suspend_la_cle(client_reel, mailgun, alias, db):
    recevoir(client_reel, alias["alias_email"])
    assert db.query(ReplyRoute).count() == 1
    retour = parseaddr(mailgun.messages[0].message["Reply-To"])[1]
    assert evenement(client_reel, "complained", CORRESPONDANT, alias["alias_email"]).json() == {"status": "route_removed"}
    db.expire_all()
    assert db.query(ReplyRoute).count() == 0
    mailgun.vider()
    refus = recevoir(client_reel, retour, expediteur="alice@example.com")
    assert refus.json() == {"status": "ignored"}

    for i in range(3):
        evenement(client_reel, "complained", f"plaignant-{i}@exemple.org", alias["alias_email"])
    db.expire_all()
    assert db.query(Key).one().status == "active"
    assert evenement(client_reel, "complained", "plaignant-9@exemple.org", alias["alias_email"]).json() == {"status": "key_suspended"}
    db.expire_all()
    cle = db.query(Key).one()
    assert cle.status == "suspended" and cle.suspension_reason == "abuse"
    assert recevoir(client_reel, alias["alias_email"]).json() == {"status": "ignored"}
    assert client_reel.get("/alias", headers=entetes(alias["cle"])).status_code == 403


def test_evenement_non_signe_refuse_et_rejeu_sans_effet(client_reel, mailgun, alias, db):
    fausse = {"timestamp": "1", "token": "x", "signature": "0" * 64}
    assert evenement(client_reel, "failed", ADRESSE_REELLE, transfert_de(alias), gravite="permanent", raison="bounce", signature=fausse).status_code == 403
    assert statut_alias(db, alias) == "active"

    signature = signature_mailgun()
    for _ in range(4):
        evenement(client_reel, "failed", ADRESSE_REELLE, transfert_de(alias), gravite="temporary", raison="generic", signature=signature)
    assert sante(db).soft_failures == 1
    rejoue = evenement(client_reel, "failed", ADRESSE_REELLE, transfert_de(alias), gravite="temporary", raison="generic", signature=signature)
    assert rejoue.json() == {"status": "duplicate"}


def test_evenement_mal_forme_ou_inconnu_sans_effet(client_reel, mailgun, alias, db):
    assert client_reel.post("/email/events", json={"signature": signature_mailgun()}).status_code == 400
    assert client_reel.post("/email/events", json={"signature": signature_mailgun(), "event-data": {"event": "failed"}}).json() == {"status": "ignored"}
    assert evenement(client_reel, "opened", ADRESSE_REELLE, transfert_de(alias)).json() == {"status": "ignored"}
    assert evenement(client_reel, "unsubscribed", ADRESSE_REELLE, transfert_de(alias)).json() == {"status": "resubscribed"}
    assert mailgun.suppressions == ["unsubscribes/alice%40example.com"]
    assert statut_alias(db, alias) == "active"


def test_aucune_adresse_dans_les_journaux_des_evenements(client_reel, mailgun, alias, caplog):
    with caplog.at_level(logging.DEBUG):
        evenement(client_reel, "failed", ADRESSE_REELLE, transfert_de(alias), gravite="permanent", raison="bounce")
        evenement(client_reel, "complained", ADRESSE_REELLE, transfert_de(alias))
        evenement(client_reel, "failed", CORRESPONDANT, alias["alias_email"], gravite="permanent", raison="bounce")
    journal = caplog.text.lower()
    for fragment in ("alice@", "jean.dupont", alias["alias_email"].split("@")[0]):
        assert fragment not in journal
