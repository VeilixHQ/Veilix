import httpx
import pytest


class FausseReponse:
    def __init__(self, statut, contenu=None):
        self.status_code = statut
        self._contenu = contenu

    def json(self):
        return self._contenu


@pytest.fixture
def hibp(monkeypatch):
    from app.core import config
    from app.services import breach_check_service

    monkeypatch.setattr(config, "HIBP_API_KEY", "cle-hibp-de-test")
    appels = []
    etat = {"reponse": FausseReponse(404)}

    def faux_get(url, params=None, headers=None, timeout=None):
        appels.append({"url": url, "params": params, "headers": headers})
        if isinstance(etat["reponse"], Exception):
            raise etat["reponse"]
        return etat["reponse"]

    monkeypatch.setattr(breach_check_service.httpx, "get", faux_get)
    return appels, etat


def test_adresse_absente_des_fuites(client, hibp):
    appels, _ = hibp
    reponse = client.post("/leaks/check", json={"email": "Personne@Example.com"})
    assert reponse.status_code == 200
    assert reponse.json() == {"found": False, "breaches": []}
    assert appels[0]["url"].endswith("/breachedaccount/personne%40example.com")
    assert appels[0]["headers"]["hibp-api-key"] == "cle-hibp-de-test"


def test_fuites_traduites_et_triees(client, hibp):
    _, etat = hibp
    etat["reponse"] = FausseReponse(200, [
        {"Name": "Ancien", "Title": "Ancien site", "Domain": "ancien.fr", "BreachDate": "2019-03-01", "PwnCount": 1200, "DataClasses": ["Email addresses", "Passwords"], "IsVerified": True},
        {"Name": "Recent", "Title": "Site récent", "Domain": "recent.fr", "BreachDate": "2026-10-12", "PwnCount": 5000000, "DataClasses": ["Bank account numbers", "Classe inconnue"], "IsVerified": False},
        {"Name": "Faux", "Title": "Fuite inventée", "Domain": "", "BreachDate": "2020-01-01", "PwnCount": 10, "DataClasses": [], "IsFabricated": True},
    ])
    reponse = client.post("/leaks/check", json={"email": "victime@example.com"})
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["found"] is True
    assert [fuite["name"] for fuite in corps["breaches"]] == ["Recent", "Ancien"]
    assert corps["breaches"][0]["data"] == ["Numéros de compte bancaire (IBAN)", "Classe inconnue"]
    assert corps["breaches"][0]["verified"] is False
    assert corps["breaches"][1]["data"] == ["Adresses e-mail", "Mots de passe"]


def test_adresse_invalide_refusee(client, hibp):
    appels, _ = hibp
    reponse = client.post("/leaks/check", json={"email": "pas-une-adresse"})
    assert reponse.status_code == 422
    assert appels == []


def test_robot_piege_sans_appel_externe(client, hibp):
    appels, _ = hibp
    reponse = client.post("/leaks/check", json={"email": "robot@example.com", "website": "spam"})
    assert reponse.status_code == 200
    assert reponse.json() == {"found": False, "breaches": []}
    assert appels == []


@pytest.mark.parametrize("erreur", [FausseReponse(429), FausseReponse(401), httpx.ConnectError("hors ligne")])
def test_service_indisponible(client, hibp, erreur):
    _, etat = hibp
    etat["reponse"] = erreur
    reponse = client.post("/leaks/check", json={"email": "victime@example.com"})
    assert reponse.status_code == 503


def test_sans_cle_le_service_est_indisponible(client, monkeypatch):
    from app.core import config

    monkeypatch.setattr(config, "HIBP_API_KEY", "")
    reponse = client.post("/leaks/check", json={"email": "victime@example.com"})
    assert reponse.status_code == 503


def test_limite_par_adresse_ip(client, hibp):
    from app.core import config

    for _ in range(config.LEAK_CHECK_PER_IP_HOUR):
        assert client.post("/leaks/check", json={"email": "victime@example.com"}).status_code == 200
    reponse = client.post("/leaks/check", json={"email": "victime@example.com"})
    assert reponse.status_code == 429
    assert "retry-after" in reponse.headers


def test_limite_globale(client, hibp, monkeypatch):
    from app.core import config

    monkeypatch.setattr(config, "LEAK_CHECK_GLOBAL_PER_MINUTE", 2)
    assert client.post("/leaks/check", json={"email": "a@example.com"}).status_code == 200
    assert client.post("/leaks/check", json={"email": "b@example.com"}).status_code == 200
    assert client.post("/leaks/check", json={"email": "c@example.com"}).status_code == 429
