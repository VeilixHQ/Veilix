import os
import subprocess
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
    env = dict(os.environ, APP_ENV="production")
    resultat = subprocess.run([sys.executable, "-c", script], cwd=BACKEND, env=env, capture_output=True, text=True, timeout=60)
    assert resultat.returncode == 0, resultat.stderr
    codes, hsts = resultat.stdout.strip().splitlines()
    assert codes == "404 404 404"
    assert hsts.startswith("max-age=")
