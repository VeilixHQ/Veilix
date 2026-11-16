import os
import subprocess

import pytest
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent


def test_en_tetes_de_securite(client):
    reponse = client.get("/")
    assert reponse.headers["x-content-type-options"] == "nosniff"
    assert reponse.headers["x-frame-options"] == "DENY"
    assert reponse.headers["referrer-policy"] == "no-referrer"
    assert reponse.headers["cache-control"] == "no-store"
    assert "strict-transport-security" not in reponse.headers


def test_cors_refuse_une_origine_etrangere(client):
    reponse = client.options("/key/verify", headers={"Origin": "https://pirate.example", "Access-Control-Request-Method": "POST"})
    assert reponse.status_code == 400
    assert "access-control-allow-origin" not in reponse.headers


def test_cors_accepte_le_site_sans_cookies(client):
    reponse = client.options("/key/verify", headers={"Origin": "https://app.veilix.test", "Access-Control-Request-Method": "POST"})
    assert reponse.status_code == 200
    assert reponse.headers["access-control-allow-origin"] == "https://app.veilix.test"
    assert "access-control-allow-credentials" not in reponse.headers


def test_en_production_documentation_masquee_et_hsts_actif():
    script = (
        "from fastapi.testclient import TestClient\n"
        "from app.main import app\n"
        "c = TestClient(app)\n"
        "print(c.get('/docs').status_code, c.get('/redoc').status_code, c.get('/openapi.json').status_code)\n"
        "print(c.get('/').headers.get('strict-transport-security'))\n"
    )
    env = dict(os.environ, APP_ENV="production", CLIENT_IP_HEADER="X-Real-IP")
    resultat = subprocess.run([sys.executable, "-c", script], cwd=BACKEND, env=env, capture_output=True, text=True, timeout=60)
    assert resultat.returncode == 0, resultat.stderr
    codes, hsts = resultat.stdout.strip().splitlines()
    assert codes == "404 404 404"
    assert hsts.startswith("max-age=")


def test_ip_cliente_ignore_les_en_tetes_par_defaut(client):
    from tests.conftest import nouvelle_cle

    codes = [
        client.post("/key/register", json={"key_id": nouvelle_cle()}, headers={"X-Real-IP": f"10.0.0.{i}", "X-Forwarded-For": f"10.0.1.{i}"}).status_code
        for i in range(21)
    ]
    assert 429 not in codes[:20]
    assert codes[20] == 429


def test_ip_cliente_lue_depuis_l_en_tete_du_proxy_si_configure(monkeypatch):
    from starlette.requests import Request

    from app.core import limiter

    requete = Request({"type": "http", "headers": [(b"x-real-ip", b"203.0.113.7")], "client": ("10.0.0.1", 1234)})
    assert limiter.client_ip(requete) == "10.0.0.1"
    monkeypatch.setattr(limiter, "CLIENT_IP_HEADER", "X-Real-IP")
    assert limiter.client_ip(requete) == "203.0.113.7"
    sans_entete = Request({"type": "http", "headers": [], "client": ("10.0.0.1", 1234)})
    assert limiter.client_ip(sans_entete) == "10.0.0.1"


def test_production_refuse_de_demarrer_sans_secrets():
    env = {k: v for k, v in os.environ.items() if k not in ("HMAC_SECRET",)}
    env.update(APP_ENV="production", HMAC_SECRET="")
    resultat = subprocess.run([sys.executable, "-c", "import app.core.config"], cwd=BACKEND, env=env, capture_output=True, text=True, timeout=60)
    assert resultat.returncode != 0
    assert "Configuration de production incomplète" in resultat.stderr


@pytest.mark.parametrize("reglages, message", [
    ({"FRONTEND_URL": "http://localhost:3000"}, "FRONTEND_URL"),
    ({"CORS_ORIGINS": "https://veilix.fr,http://localhost:3000"}, "CORS_ORIGINS"),
    ({"FRONTEND_URL": "http://veilix.fr"}, "FRONTEND_URL"),
    ({"CLIENT_IP_HEADER": ""}, "CLIENT_IP_HEADER"),
])
def test_production_refuse_une_configuration_locale(reglages, message):
    env = dict(os.environ, APP_ENV="production", CLIENT_IP_HEADER="X-Real-IP", FRONTEND_URL="https://veilix.fr", CORS_ORIGINS="https://veilix.fr")
    env.update(reglages)
    resultat = subprocess.run([sys.executable, "-c", "import app.core.config"], cwd=BACKEND, env=env, capture_output=True, text=True, timeout=60)
    assert resultat.returncode != 0
    assert message in resultat.stderr


def test_production_demarre_avec_une_configuration_complete():
    env = dict(os.environ, APP_ENV="production", CLIENT_IP_HEADER="X-Real-IP", FRONTEND_URL="https://veilix.fr", CORS_ORIGINS="https://veilix.fr,https://www.veilix.fr")
    resultat = subprocess.run([sys.executable, "-c", "import app.core.config"], cwd=BACKEND, env=env, capture_output=True, text=True, timeout=60)
    assert resultat.returncode == 0, resultat.stderr


def test_aucun_journal_d_acces_avec_les_ip():
    import logging

    import app.main

    assert logging.getLogger("uvicorn.access").disabled is True
