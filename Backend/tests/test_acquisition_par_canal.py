from sqlalchemy import inspect

from app.core import config
from app.models.acquisition import AcquisitionDaily
from app.services.acquisition_service import normalize_channel
from tests.conftest import code_d_acces, corps_d_inscription, nouvelle_cle
from tests.test_beta_e2e_et_anti_abus import beta, postuler

JETON = "jeton-statistiques-de-test-0123456789"


def test_normalisation_des_canaux():
    assert normalize_channel("Twitter") == "x"
    assert normalize_channel("REDDIT") == "reddit"
    assert normalize_channel("") == "direct"
    assert normalize_channel(None) == "direct"
    assert normalize_channel("<script>alert(1)</script>") == "autre"
    assert normalize_channel("perplexity") == "perplexity"


def test_inscription_compte_par_canal_sans_donnee_personnelle(client, db):
    for canal in ("tiktok", "tiktok", "google"):
        assert client.post("/key/register", json={**corps_d_inscription(nouvelle_cle(), code_d_acces()), "channel": canal}).status_code == 200
    assert client.post("/key/register", json=corps_d_inscription(nouvelle_cle(), code_d_acces())).status_code == 200
    lignes = {(r.channel, r.event): r.count for r in db.query(AcquisitionDaily).all()}
    assert lignes == {("tiktok", "register"): 2, ("google", "register"): 1, ("direct", "register"): 1}
    colonnes = {c["name"] for c in inspect(db.get_bind()).get_columns("acquisition_daily")}
    assert colonnes == {"id", "day", "channel", "event", "count"}


def test_liste_d_attente_comptee(client, db, beta):
    assert postuler(client, "canal@example.com", channel="reddit").status_code == 202
    ligne = db.query(AcquisitionDaily).one()
    assert (ligne.channel, ligne.event, ligne.count) == ("reddit", "waitlist", 1)


def test_inscription_refusee_non_comptee(client, db):
    assert client.post("/key/register", json={**corps_d_inscription(nouvelle_cle(), "CODE-INEXISTANT"), "channel": "x"}).status_code >= 400
    assert db.query(AcquisitionDaily).count() == 0


def test_statistiques_protegees_par_jeton(client, monkeypatch):
    monkeypatch.setattr(config, "STATS_API_TOKEN", JETON)
    client.post("/key/register", json={**corps_d_inscription(nouvelle_cle(), code_d_acces()), "channel": "x"})
    assert client.get("/stats/acquisition").status_code == 404
    assert client.get("/stats/acquisition", headers={"Authorization": "Bearer faux"}).status_code == 404
    reponse = client.get("/stats/acquisition", headers={"Authorization": f"Bearer {JETON}"})
    assert reponse.status_code == 200
    assert reponse.json()["totals"] == {"x": {"waitlist": 0, "register": 1}}


def test_statistiques_desactivees_sans_jeton(client, monkeypatch):
    monkeypatch.setattr(config, "STATS_API_TOKEN", "")
    assert client.get("/stats/acquisition", headers={"Authorization": "Bearer "}).status_code == 404
