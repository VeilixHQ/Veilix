import logging
from urllib.parse import quote

import httpx

from app.core import config

logger = logging.getLogger("veilix.breach_check")

USER_AGENT = "Veilix-leak-check"

DATA_CLASSES = {
    "Account balances": "Soldes de compte",
    "Ages": "Âges",
    "Auth tokens": "Jetons d'authentification",
    "Bank account numbers": "Numéros de compte bancaire (IBAN)",
    "Browser user agent details": "Informations sur le navigateur",
    "Credit card CVV": "Cryptogrammes de carte bancaire",
    "Credit cards": "Cartes bancaires",
    "Credit status information": "Informations de solvabilité",
    "Customer feedback": "Avis clients",
    "Dates of birth": "Dates de naissance",
    "Device information": "Informations sur l'appareil",
    "Education levels": "Niveaux d'études",
    "Email addresses": "Adresses e-mail",
    "Email messages": "Contenu d'e-mails",
    "Employers": "Employeurs",
    "Ethnicities": "Origines ethniques",
    "Family members' names": "Noms de proches",
    "Genders": "Genres",
    "Geographic locations": "Localisations",
    "Government issued IDs": "Pièces d'identité",
    "Health insurance information": "Informations d'assurance santé",
    "Historical passwords": "Anciens mots de passe",
    "Income levels": "Revenus",
    "IP addresses": "Adresses IP",
    "Job titles": "Postes occupés",
    "Marital statuses": "Situations familiales",
    "Names": "Noms",
    "Nationalities": "Nationalités",
    "Partial credit card data": "Données partielles de carte bancaire",
    "Passport numbers": "Numéros de passeport",
    "Password hints": "Indices de mot de passe",
    "Passwords": "Mots de passe",
    "Phone numbers": "Numéros de téléphone",
    "Physical addresses": "Adresses postales",
    "Private messages": "Messages privés",
    "Purchases": "Achats",
    "Salutations": "Civilités",
    "Security questions and answers": "Questions et réponses de sécurité",
    "Sexual orientations": "Orientations sexuelles",
    "Social media profiles": "Profils de réseaux sociaux",
    "Social security numbers": "Numéros de sécurité sociale",
    "Spoken languages": "Langues parlées",
    "Time zones": "Fuseaux horaires",
    "Usernames": "Noms d'utilisateur",
    "Website activity": "Activité sur le site",
}


class LeakServiceUnavailable(Exception):
    pass


def translate(data_class: str) -> str:
    return DATA_CLASSES.get(data_class, data_class)


def check(email: str) -> list[dict]:
    if not config.HIBP_API_KEY:
        raise LeakServiceUnavailable("clé absente")
    url = f"{config.HIBP_API_URL}/breachedaccount/{quote(email.strip().lower(), safe='')}"
    try:
        response = httpx.get(
            url,
            params={"truncateResponse": "false"},
            headers={"hibp-api-key": config.HIBP_API_KEY, "user-agent": USER_AGENT},
            timeout=10,
        )
    except httpx.HTTPError as error:
        logger.warning("Vérification de fuite indisponible : %s", type(error).__name__)
        raise LeakServiceUnavailable("réseau") from None
    if response.status_code == 404:
        return []
    if response.status_code != 200:
        logger.warning("Vérification de fuite indisponible : statut %s", response.status_code)
        raise LeakServiceUnavailable(str(response.status_code))
    breaches = []
    for item in response.json():
        if item.get("IsFabricated"):
            continue
        breaches.append({
            "name": item.get("Name", ""),
            "title": item.get("Title") or item.get("Name", ""),
            "domain": item.get("Domain") or "",
            "date": item.get("BreachDate") or "",
            "count": int(item.get("PwnCount") or 0),
            "data": [translate(value) for value in item.get("DataClasses") or []],
            "verified": bool(item.get("IsVerified", True)),
        })
    breaches.sort(key=lambda breach: breach["date"], reverse=True)
    return breaches
