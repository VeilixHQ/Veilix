import re
from datetime import timedelta

import pytest

from app.core import config
from app.core.keys import stored_key_id
from app.models.access_code import AccessCode
from app.models.alias import Alias
from app.models.beta import BetaFeedback, BetaSignup
from app.models.key import Key
from app.services import beta_service, email_service
from tests.conftest import corps_d_inscription, entetes, nouvelle_cle

INVITATION = "lien-secret-de-test"
RETOUR = {
    "features_tried": ["creation", "transfert"],
    "alias_lifecycle": "oui",
    "forwarding_ok": "oui",
    "problem": "",
    "unclear": "Le libellé des tags",
    "recommend": 9,
    "recommend_why": "Simple",
}


@pytest.fixture
def beta(monkeypatch):
    monkeypatch.setattr(config, "BETA_PRIVATE_INVITE_TOKEN", INVITATION)
    monkeypatch.setattr(config, "BETA_PRIVATE_SEATS", 2)
    monkeypatch.setattr(config, "BETA_PRIVATE_ENDS_AT", None)
    monkeypatch.setattr(config, "BETA_PUBLIC_OPENS_AT", None)
    monkeypatch.setattr(config, "BETA_PUBLIC_ENDS_AT", None)
    monkeypatch.setattr(config, "BETA_PUBLIC_WAVE1_SEATS", 2)
    monkeypatch.setattr(config, "BETA_PUBLIC_WAVE2_SEATS", 3)
    monkeypatch.setattr(config, "BETA_PUBLIC_WAVE2_AFTER_DAYS", 14)
    monkeypatch.setattr(config, "BETA_PUBLIC_WAVE2_HOLD", False)
    monkeypatch.setattr(config, "BETA_CODE_VALID_DAYS", 7)
    monkeypatch.setattr(config, "BETA_PRIVATE_OPENS_AT", None)
    monkeypatch.setattr(config, "BETA_PRIVATE_SIGNUPS_CLOSE_AT", None)
    monkeypatch.setattr(config, "BETA_PUBLIC_SIGNUPS_CLOSE_AT", None)
    monkeypatch.setattr(config, "LAUNCH_AT", None)
    return monkeypatch


def postuler(client, email, invitation=INVITATION, **autres):
    corps = {"email": email, "consent": True, **autres}
    if invitation:
        corps["invitation"] = invitation
    return client.post("/beta/signup", json=corps)


def envoyes_a(emails, adresse):
    return [e for e in emails if e["to"] == adresse]


def code_recu(emails, adresse):
    texte = envoyes_a(emails, adresse)[-1]["text"]
    return re.search(r"VEILIX-(?:PRIV|PUB)-[A-Z0-9]{5}-[A-Z0-9]{5}", texte).group(0)


def activer(client, code):
    cle = nouvelle_cle()
    corps = corps_d_inscription(cle, code)
    del corps["contact_email"]
    reponse = client.post("/key/register", json=corps)
    assert reponse.status_code == 200, reponse.text
    return cle


def cle_en_base(db, cle):
    db.expire_all()
    return db.query(Key).filter(Key.key_id == stored_key_id(cle)).one()


def test_beta_privee_exige_le_lien_d_invitation(client, beta, emails):
    assert postuler(client, "a@example.com", invitation=None).status_code == 409
    assert postuler(client, "a@example.com", invitation="mauvais").status_code == 403
    beta.setattr(config, "BETA_PRIVATE_INVITE_TOKEN", "")
    assert postuler(client, "a@example.com").status_code == 403
    assert emails == []


def test_inscription_privee_envoie_le_code_et_l_inscription_n_a_plus_besoin_d_adresse(client, beta, emails, db):
    assert postuler(client, "testeur@example.com").status_code == 202
    code = code_recu(emails, "testeur@example.com")
    assert code.startswith("VEILIX-PRIV-")
    assert client.post("/key/check-code", json={"access_code": code}).json()["needs_contact"] is False

    cle = activer(client, code)
    enregistrement = cle_en_base(db, cle)
    assert enregistrement.plan == "pack"
    assert enregistrement.contact_email_hmac == db.query(BetaSignup).one().email_hmac
    assert db.query(BetaSignup).one().status == "registered"
    assert "testeur" not in db.query(BetaSignup).one().email


def test_places_limitees_puis_liste_d_attente(client, beta, emails, db):
    for adresse in ("a@example.com", "b@example.com", "c@example.com"):
        assert postuler(client, adresse).status_code == 202
    assert "VEILIX-PRIV-" in envoyes_a(emails, "a@example.com")[0]["text"]
    assert "VEILIX-PRIV-" in envoyes_a(emails, "b@example.com")[0]["text"]
    attente = envoyes_a(emails, "c@example.com")
    assert len(attente) == 1
    assert "position 1" in attente[0]["text"]
    assert db.query(AccessCode).count() == 2


def test_code_expire_libere_la_place_pour_le_suivant(client, beta, emails, db):
    for adresse in ("a@example.com", "b@example.com", "c@example.com"):
        postuler(client, adresse)
    plus_tard = beta_service.now_utc() + timedelta(days=8)
    rapport = beta_service.tick(db, plus_tard)
    assert rapport["expired"] == 2
    assert "a expiré" in envoyes_a(emails, "a@example.com")[-1]["text"]
    assert "VEILIX-PRIV-" in envoyes_a(emails, "c@example.com")[-1]["text"]


def test_meme_adresse_une_seule_fois_et_reponse_identique(client, beta, emails):
    premiere = postuler(client, "a@example.com")
    seconde = postuler(client, "A@example.com ")
    assert premiere.json() == seconde.json() == {"status": "ok"}
    assert len(envoyes_a(emails, "a@example.com")) == 1


def test_champ_piege_ignore_les_robots(client, beta, emails, db):
    assert postuler(client, "robot@example.com", website="http://spam").status_code == 202
    assert emails == []
    assert db.query(BetaSignup).count() == 0


def test_echec_d_envoi_laisse_le_candidat_en_attente(client, beta, db, monkeypatch):
    def panne(*_, **__):
        raise email_service.MailgunError("HTTP 500")

    monkeypatch.setattr(email_service, "_post_mailgun", panne)
    postuler(client, "a@example.com")
    assert db.query(AccessCode).count() == 0
    assert db.query(BetaSignup).one().status == "waiting"


def test_beta_publique_par_vagues_automatiques(client, beta, emails, db):
    beta.setattr(config, "BETA_CODE_VALID_DAYS", 30)
    assert postuler(client, "x@example.com", invitation=None).status_code == 409
    debut = beta_service.now_utc() - timedelta(hours=1)
    beta.setattr(config, "BETA_PUBLIC_OPENS_AT", debut)
    assert client.get("/beta/status").json()["public"]["wave"] == 1

    for i in range(4):
        assert postuler(client, f"p{i}@example.com", invitation=None).status_code == 202
    assert db.query(AccessCode).filter(AccessCode.phase == "public").count() == 2

    beta.setattr(config, "BETA_PUBLIC_WAVE2_HOLD", True)
    assert beta_service.tick(db, debut + timedelta(days=15))["invited"] == 0

    beta.setattr(config, "BETA_PUBLIC_WAVE2_HOLD", False)
    assert beta_service.tick(db, debut + timedelta(days=13))["invited"] == 0
    assert beta_service.tick(db, debut + timedelta(days=14, minutes=1))["invited"] == 2
    assert "VEILIX-PUB-" in envoyes_a(emails, "p3@example.com")[-1]["text"]


def test_place_publique_liberee_si_pas_de_paiement(client, beta, emails, db):
    beta.setattr(config, "BETA_PUBLIC_OPENS_AT", beta_service.now_utc() - timedelta(hours=1))
    postuler(client, "p@example.com", invitation=None)
    cle = activer(client, code_recu(emails, "p@example.com"))
    assert cle_en_base(db, cle).status == "pending_payment"
    assert beta_service.tick(db, beta_service.now_utc() + timedelta(days=8))["released_unpaid"] == 1
    db.expire_all()
    assert db.query(Key).count() == 0


def test_rappel_puis_suspension_puis_reactivation(client, beta, emails, db):
    postuler(client, "t@example.com")
    cle = activer(client, code_recu(emails, "t@example.com"))
    echeance = cle_en_base(db, cle).feedback_due_at
    assert client.get("/beta/me", headers=entetes(cle)).json()["feedback_due_at"]

    assert beta_service.tick(db, echeance + timedelta(hours=1))["reminders"] == 1
    assert "Rappel" in envoyes_a(emails, "t@example.com")[-1]["subject"]
    assert beta_service.tick(db, echeance + timedelta(hours=2))["reminders"] == 0
    assert beta_service.tick(db, echeance + timedelta(hours=48))["suspended"] == 0
    assert beta_service.tick(db, echeance + timedelta(hours=50))["suspended"] == 1
    assert "suspendu" in envoyes_a(emails, "t@example.com")[-1]["subject"]

    assert client.get("/alias", headers=entetes(cle)).status_code == 403
    assert client.get("/beta/me", headers=entetes(cle)).json()["suspended_for_feedback"] is True

    reponse = client.post("/beta/feedback", headers=entetes(cle), json=RETOUR)
    assert reponse.status_code == 200
    assert reponse.json()["suspended_for_feedback"] is False
    assert client.get("/alias", headers=entetes(cle)).status_code == 200
    assert "réactivé" in envoyes_a(emails, "t@example.com")[-1]["subject"]

    retour = db.query(BetaFeedback).one()
    assert retour.answers.startswith("v2:")
    assert "tags" not in retour.answers
    nouvelle = cle_en_base(db, cle).feedback_due_at
    assert nouvelle > beta_service.now_utc() + timedelta(days=6)


def test_retour_final_et_cloture(client, beta, emails, db):
    fin = beta_service.now_utc() + timedelta(days=5)
    beta.setattr(config, "BETA_PRIVATE_ENDS_AT", fin)
    postuler(client, "f@example.com")
    cle = activer(client, code_recu(emails, "f@example.com"))
    assert cle_en_base(db, cle).feedback_due_at <= fin
    assert client.get("/beta/me", headers=entetes(cle)).json()["final_window"] is False

    cle_en_base(db, cle).created_at = beta_service.now_utc() - timedelta(days=4)
    db.commit()
    statut = client.post("/beta/feedback", headers=entetes(cle), json=RETOUR).json()
    assert statut["final_window"] is True
    assert statut["final_sent"] is True
    assert db.query(BetaFeedback).one().is_final is True

    assert beta_service.tick(db, fin + timedelta(minutes=1))["closing"] == 1
    assert "Fin de la bêta privée" in envoyes_a(emails, "f@example.com")[-1]["subject"]
    assert beta_service.tick(db, fin + timedelta(minutes=2))["closing"] == 0


def test_supprimer_son_compte_efface_tout_et_libere_la_place(client, beta, emails, db):
    for adresse in ("a@example.com", "b@example.com", "c@example.com"):
        postuler(client, adresse)
    cle = activer(client, code_recu(emails, "a@example.com"))
    client.post("/alias", headers=entetes(cle), json={"destination_email": "dest@example.com"})
    client.post("/beta/feedback", headers=entetes(cle), json=RETOUR)

    assert client.delete("/key/me", headers=entetes(cle)).status_code == 204
    db.expire_all()
    assert db.query(Key).count() == 0
    assert db.query(Alias).count() == 0
    assert db.query(BetaFeedback).count() == 0
    assert db.query(BetaSignup).filter(BetaSignup.status == "registered").count() == 0
    assert "VEILIX-PRIV-" in envoyes_a(emails, "c@example.com")[-1]["text"]
    assert client.get("/key/me", headers=entetes(cle)).status_code == 401


def test_administration_reservee_aux_admins(client, beta, emails, db):
    postuler(client, "a@example.com")
    testeur = activer(client, code_recu(emails, "a@example.com"))
    assert client.get("/admin/beta", headers=entetes(testeur)).status_code == 404

    admin = nouvelle_cle()
    from tests.conftest import inscrire
    inscrire(client, key_id=admin)
    db.query(Key).filter(Key.key_id == stored_key_id(admin)).update({Key.is_admin: True})
    db.commit()

    vue = client.get("/admin/beta", headers=entetes(admin)).json()
    assert vue["phases"]["private"]["seats_taken"] == 1
    assert any(t["contact"] == "a@example.com" for t in vue["testers"])

    client.post("/beta/feedback", headers=entetes(testeur), json=RETOUR)
    retours = client.get("/admin/beta/feedback", headers=entetes(admin)).json()
    assert retours[0]["answers"]["unclear"] == "Le libellé des tags"

    code_id = next(t["code_id"] for t in vue["testers"] if t["contact"] == "a@example.com")
    assert client.post(f"/admin/beta/codes/{code_id}/revoke", headers=entetes(admin)).status_code == 200
    assert cle_en_base(db, testeur).suspension_reason == "fraud"
    assert client.post("/beta/feedback", headers=entetes(testeur), json=RETOUR).status_code == 403


def test_admin_limite_aux_ip_autorisees(client, beta, db, monkeypatch):
    admin = nouvelle_cle()
    from tests.conftest import inscrire
    inscrire(client, key_id=admin)
    db.query(Key).update({Key.is_admin: True})
    db.commit()
    monkeypatch.setattr(config, "ADMIN_ALLOWED_IPS", {"203.0.113.5"})
    assert client.get("/admin/beta", headers=entetes(admin)).status_code == 404


def test_planificateur_unique(beta):
    from app.core import scheduler
    from app.db.session import engine
    from sqlalchemy import text

    assert scheduler.run_once() is not None
    with engine.connect() as conn:
        conn.execute(text("SELECT pg_advisory_lock(:id)"), {"id": scheduler.LOCK_ID})
        try:
            assert scheduler.run_once() is None
        finally:
            conn.execute(text("SELECT pg_advisory_unlock(:id)"), {"id": scheduler.LOCK_ID})


def test_calendrier_par_defaut(monkeypatch):
    from datetime import datetime
    for nom in ("BETA_PRIVATE_OPENS_AT", "BETA_PRIVATE_ENDS_AT", "LAUNCH_AT"):
        monkeypatch.delenv(nom, raising=False)
    assert config._env_datetime("BETA_PRIVATE_OPENS_AT", "2026-12-01T00:00:00+01:00") == datetime(2026, 11, 30, 23, 0)
    assert config._env_datetime("LAUNCH_AT", "2027-03-01T00:00:00+01:00") == datetime(2027, 2, 28, 23, 0)
    monkeypatch.setenv("LAUNCH_AT", "")
    assert config._env_datetime("LAUNCH_AT", "2027-03-01T00:00:00+01:00") is None
    assert beta_service._day_fr(datetime(2026, 11, 30, 23, 0)) == "1er décembre 2026"
    assert beta_service._date_fr(datetime(2027, 7, 1, 10, 0)) == "1er juillet 2027 à 12:00"


def test_fenetre_d_inscription_privee(client, beta, emails):
    maintenant = beta_service.now_utc()
    beta.setattr(config, "BETA_PRIVATE_OPENS_AT", maintenant + timedelta(days=1))
    assert postuler(client, "tot@example.com").status_code == 409
    statut = client.get("/beta/status").json()["private"]
    assert statut["open"] is False and statut["opens_at"]

    beta.setattr(config, "BETA_PRIVATE_OPENS_AT", maintenant - timedelta(days=2))
    beta.setattr(config, "BETA_PRIVATE_SIGNUPS_CLOSE_AT", maintenant - timedelta(days=1))
    assert postuler(client, "tard@example.com").status_code == 409

    beta.setattr(config, "BETA_PRIVATE_SIGNUPS_CLOSE_AT", maintenant + timedelta(days=1))
    assert postuler(client, "juste@example.com").status_code == 202
    assert "VEILIX-PRIV-" in envoyes_a(emails, "juste@example.com")[0]["text"]


def test_e_mail_a_l_echeance_avec_lien_direct(client, beta, emails, db):
    postuler(client, "e@example.com")
    cle = activer(client, code_recu(emails, "e@example.com"))
    echeance = cle_en_base(db, cle).feedback_due_at
    lien = "https://app.veilix.test/dashboard?retour=1"

    assert beta_service.tick(db, echeance - timedelta(hours=25))["due_notices"] == 0
    assert beta_service.tick(db, echeance - timedelta(hours=23))["due_notices"] == 1
    avis = envoyes_a(emails, "e@example.com")[-1]
    assert avis["subject"].startswith("C'est le moment")
    assert lien in avis["text"]
    assert beta_service.tick(db, echeance - timedelta(hours=1))["due_notices"] == 0

    beta_service.tick(db, echeance + timedelta(minutes=5))
    assert lien in envoyes_a(emails, "e@example.com")[-1]["text"]
    beta_service.tick(db, echeance + timedelta(hours=50))
    suspension = envoyes_a(emails, "e@example.com")[-1]
    assert "suspendu" in suspension["subject"]
    assert lien in suspension["text"]

    client.post("/beta/feedback", headers=entetes(cle), json=RETOUR)
    prochaine = cle_en_base(db, cle).feedback_due_at
    assert beta_service.tick(db, prochaine - timedelta(hours=2))["due_notices"] == 1


def test_cloture_annonce_la_date_de_lancement(client, beta, emails, db):
    from datetime import datetime
    fin = beta_service.now_utc() + timedelta(days=5)
    beta.setattr(config, "BETA_PRIVATE_ENDS_AT", fin)
    beta.setattr(config, "LAUNCH_AT", datetime(2027, 2, 28, 23, 0))
    postuler(client, "l@example.com")
    activer(client, code_recu(emails, "l@example.com"))
    beta_service.tick(db, fin + timedelta(minutes=1))
    texte = envoyes_a(emails, "l@example.com")[-1]["text"]
    assert "le 1er mars 2027" in texte
    assert "3 mois offerts" in texte


def test_premier_retour_compte_a_partir_de_la_creation_de_la_cle(client, beta, emails, db):
    beta.setattr(config, "BETA_PRIVATE_ENDS_AT", beta_service.now_utc() + timedelta(days=40))
    postuler(client, "tot@example.com")
    postuler(client, "tard@example.com")
    tot = activer(client, code_recu(emails, "tot@example.com"))
    cle_en_base(db, tot).created_at = beta_service.now_utc() - timedelta(days=5)
    db.commit()
    tard = activer(client, code_recu(emails, "tard@example.com"))

    maintenant = beta_service.now_utc()
    echeance = cle_en_base(db, tard).feedback_due_at
    assert maintenant + timedelta(days=6, hours=23) < echeance <= maintenant + timedelta(days=7)
    assert client.get("/beta/me", headers=entetes(tard)).json()["overdue"] is False
    assert beta_service.tick(db, maintenant + timedelta(days=5))["reminders"] == 0


def test_arrivee_tardive_garde_trois_jours_d_utilisation():
    from unittest.mock import patch

    fin = beta_service.now_utc() + timedelta(days=30)
    limite = fin - beta_service.FINAL_FEEDBACK_NOTICE
    with patch.object(config, "BETA_PRIVATE_ENDS_AT", fin):
        loin = fin - timedelta(days=20)
        assert beta_service.first_feedback_due("private", loin) == loin + timedelta(days=7)

        proche = limite - timedelta(days=4)
        assert beta_service.first_feedback_due("private", proche) == limite

        tres_proche = limite - timedelta(days=1)
        assert beta_service.first_feedback_due("private", tres_proche) == tres_proche + timedelta(days=3)

        derniere_minute = fin - timedelta(days=2)
        assert beta_service.first_feedback_due("private", derniere_minute) is None

        assert beta_service.in_final_window("private", limite - timedelta(days=1), limite - timedelta(days=2)) is False
        assert beta_service.in_final_window("private", limite - timedelta(days=1), limite - timedelta(days=5)) is True
        assert beta_service.in_final_window("private", limite + timedelta(hours=1), limite - timedelta(hours=1)) is True
        assert beta_service.in_final_window("private", limite - timedelta(days=8), None) is False

        retour_tardif = limite - timedelta(days=2)
        assert beta_service.feedback_due_after("private", retour_tardif, beta_service.FEEDBACK_PERIOD["private"]) == retour_tardif + timedelta(days=3)
