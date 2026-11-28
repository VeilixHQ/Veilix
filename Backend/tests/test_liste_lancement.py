import re
from datetime import timedelta

import pytest

from app.core import config
from app.models.launch import LaunchSignup
from app.services import beta_service, launch_service


@pytest.fixture
def lancement(monkeypatch):
    monkeypatch.setattr(config, "LAUNCH_AT", beta_service.now_utc() + timedelta(days=30))
    monkeypatch.setattr(config, "LAUNCH_NOTIFY_ENABLED", False)
    return monkeypatch


def inscrire_liste(client, email, **autres):
    return client.post("/launch/signup", json={"email": email, "consent": True, **autres})


def lien_de_retrait(email):
    return re.search(r"https://app\.veilix\.test/beta\?retrait=(\S+)", email["text"]).group(1)


def test_inscription_enregistre_une_adresse_chiffree_et_confirme(client, emails, db, lancement):
    reponse = inscrire_liste(client, "lea@example.com")
    assert reponse.status_code == 202
    lignes = db.query(LaunchSignup).all()
    assert len(lignes) == 1
    assert "lea@example.com" not in lignes[0].email
    assert [e["to"] for e in emails] == ["lea@example.com"]
    assert "liste d'attente" in emails[0]["text"]
    assert lien_de_retrait(emails[0])


def test_une_meme_adresse_n_est_inscrite_qu_une_fois(client, emails, db, lancement):
    inscrire_liste(client, "camille.martin@gmail.com")
    inscrire_liste(client, "camillemartin+lancement@gmail.com")
    assert db.query(LaunchSignup).count() == 1
    assert len(emails) == 1


def test_consentement_obligatoire_et_champ_piege(client, emails, db, lancement):
    assert client.post("/launch/signup", json={"email": "sans@example.com", "consent": False}).status_code == 400
    assert inscrire_liste(client, "robot@example.com", website="https://spam.example").status_code == 202
    assert db.query(LaunchSignup).count() == 0
    assert emails == []


def test_liste_close_apres_le_lancement(client, emails, db, lancement):
    lancement.setattr(config, "LAUNCH_AT", beta_service.now_utc() - timedelta(minutes=1))
    assert inscrire_liste(client, "tard@example.com").status_code == 409
    assert db.query(LaunchSignup).count() == 0


def test_retrait_par_le_lien_de_l_e_mail(client, emails, db, lancement):
    inscrire_liste(client, "partir@example.com")
    jeton = lien_de_retrait(emails[0])
    assert client.post("/launch/leave", json={"token": jeton}).status_code == 200
    assert db.query(LaunchSignup).count() == 0
    assert client.post("/launch/leave", json={"token": jeton}).status_code == 404


def test_retrait_refuse_un_jeton_falsifie(client, emails, db, lancement):
    inscrire_liste(client, "reste@example.com")
    identifiant = lien_de_retrait(emails[0]).split(".")[0]
    assert client.post("/launch/leave", json={"token": f"{identifiant}.{'0' * 32}"}).status_code == 404
    assert client.post("/launch/leave", json={"token": "abc"}).status_code == 404
    assert db.query(LaunchSignup).count() == 1


def test_e_mail_d_ouverture_desactive_par_defaut(client, emails, db, lancement):
    inscrire_liste(client, "attente@example.com")
    apres = config.LAUNCH_AT + timedelta(minutes=1)
    assert launch_service.notify_launch(db, apres) == 0
    assert db.query(LaunchSignup).count() == 1


def test_e_mail_d_ouverture_puis_effacement(client, emails, db, lancement):
    inscrire_liste(client, "un@example.com")
    inscrire_liste(client, "deux@example.com")
    lancement.setattr(config, "LAUNCH_NOTIFY_ENABLED", True)
    assert launch_service.notify_launch(db, config.LAUNCH_AT - timedelta(minutes=1)) == 0
    emails.clear()
    assert launch_service.notify_launch(db, config.LAUNCH_AT + timedelta(minutes=1)) == 2
    assert sorted(e["to"] for e in emails) == ["deux@example.com", "un@example.com"]
    assert all(e["subject"] == "Veilix est ouvert" for e in emails)
    assert db.query(LaunchSignup).count() == 0


def test_beta_publique_fermee_par_defaut(monkeypatch):
    monkeypatch.setattr(config, "BETA_PUBLIC_ENABLED", False)
    monkeypatch.setattr(config, "BETA_PUBLIC_OPENS_AT", beta_service.now_utc() - timedelta(days=1))
    monkeypatch.setattr(config, "BETA_PUBLIC_ENDS_AT", None)
    assert beta_service.capacity("public", beta_service.now_utc()) is None


def test_inscription_comptee_par_canal_une_seule_fois(client, emails, db, lancement):
    from app.models.acquisition import AcquisitionDaily

    inscrire_liste(client, "ia@example.com", channel="chatgpt.com")
    inscrire_liste(client, "ia@example.com", channel="chatgpt.com")
    inscrire_liste(client, "pub@example.com", channel="googleads")
    lignes = {(r.channel, r.event): r.count for r in db.query(AcquisitionDaily).all()}
    assert lignes == {("chatgpt", "waitlist"): 1, ("googleads", "waitlist"): 1}
