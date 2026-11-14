"""
Veilix - Réception, transfert et réponses d'alias via Mailgun Routes (EU).  v3

Ce que fait cette version :
- transfère TOUTES les pièces jointes, quel que soit le nom du champ envoyé
  par Mailgun (on parcourt tous les fichiers du formulaire) ;
- Reply-To inversé (reply+TOKEN@...) : la vraie adresse de l'utilisateur
  n'est jamais révélée ;
- envoi via le client httpx SYNCHRONE exécuté dans un thread (c'est celui qui
  fonctionne sur votre PC) ;
- une bannière au démarrage et /health indiquent la version qui tourne ;
- des logs de diagnostic sans adresses e-mail.

.env : MAILGUN_API_KEY, MAILGUN_SIGNING_KEY, MAILGUN_DOMAIN, FORWARD_TO
       (optionnel : REPLY_DOMAIN, REPLY_DB)
Lancement : python -m uvicorn inbound:app --port 8001
"""
import asyncio
import hashlib
import hmac
import logging
import os
import secrets
import sqlite3
from contextlib import closing
from email.utils import formataddr, parseaddr

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Response

VERSION = "v3"

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("veilix.inbound")

API_KEY = os.getenv("MAILGUN_API_KEY", "").strip()
SIGNING_KEY = os.getenv("MAILGUN_SIGNING_KEY", "").strip()
DOMAIN = os.getenv("MAILGUN_DOMAIN", "mg.veilix.fr").strip()
REPLY_DOMAIN = os.getenv("REPLY_DOMAIN", DOMAIN).strip().lower()
FORWARD_TO = os.getenv("FORWARD_TO", "").strip()
DB_PATH = os.getenv("REPLY_DB", "reply_map.db").strip()

API_URL = f"https://api.eu.mailgun.net/v3/{DOMAIN}/messages"

MAX_PIECES = 20
MAX_OCTETS = 20 * 1024 * 1024  # 20 Mo de pièces jointes au total

# alias -> adresse réelle. À remplacer par une recherche en base.
# Ne jamais en faire un relais ouvert.
ALIASES = {
    "test@mg.veilix.fr": FORWARD_TO,
}

app = FastAPI(title="Veilix Inbound Webhook")


@app.on_event("startup")
async def bannière():
    logger.info("=== Veilix inbound %s chargé (pièces jointes + réponses inversées) ===", VERSION)


# --------------------------------------------------------------------------
# Utilitaires
# --------------------------------------------------------------------------
def normaliser_email(value: str) -> str:
    _, address = parseaddr(value or "")
    return address.strip().lower()


def nettoyer(valeur: str) -> str:
    """Supprime retours à la ligne et espaces multiples (en-têtes)."""
    return " ".join((valeur or "").split())


def signature_valide(timestamp: str, token: str, signature: str) -> bool:
    if not all((SIGNING_KEY, timestamp, token, signature)):
        return False
    attendu = hmac.new(
        SIGNING_KEY.encode("utf-8"),
        msg=f"{timestamp}{token}".encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(attendu, signature)


# --------------------------------------------------------------------------
# Table des adresses de réponse (token -> alias + expéditeur d'origine).
# Contient des adresses e-mail : à ne pas versionner (.gitignore).
# À migrer plus tard dans votre vraie base.
# --------------------------------------------------------------------------
def ouvrir_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS reply_map ("
        "token TEXT PRIMARY KEY, alias TEXT NOT NULL, sender TEXT NOT NULL, "
        "UNIQUE(alias, sender))"
    )
    return conn


def token_pour(alias: str, expediteur: str) -> str:
    with closing(ouvrir_db()) as conn, conn:
        ligne = conn.execute(
            "SELECT token FROM reply_map WHERE alias = ? AND sender = ?",
            (alias, expediteur),
        ).fetchone()
        if ligne:
            return ligne[0]
        token = secrets.token_hex(10)
        conn.execute(
            "INSERT INTO reply_map (token, alias, sender) VALUES (?, ?, ?)",
            (token, alias, expediteur),
        )
        return token


def retrouver(token: str):
    with closing(ouvrir_db()) as conn:
        return conn.execute(
            "SELECT alias, sender FROM reply_map WHERE token = ?", (token,)
        ).fetchone()


# --------------------------------------------------------------------------
# Pièces jointes : on prend TOUS les fichiers du formulaire, peu importe
# le nom du champ (attachment-1, attachment-2, ...).
# --------------------------------------------------------------------------
async def lire_pieces_jointes(form):
    fichiers, total = [], 0
    for cle, valeur in form.multi_items():
        if not (hasattr(valeur, "read") and hasattr(valeur, "filename")):
            continue  # champ texte ordinaire
        contenu = await valeur.read()
        if not contenu:
            logger.warning("Fichier vide ignoré (champ %s).", cle)
            continue
        nom = valeur.filename or f"piece-{len(fichiers) + 1}"
        type_mime = valeur.content_type or "application/octet-stream"
        total += len(contenu)
        fichiers.append(("attachment", (nom, contenu, type_mime)))
        logger.info(
            "Fichier trouvé : champ=%s type=%s octets=%d",
            cle, type_mime, len(contenu),
        )
        if len(fichiers) >= MAX_PIECES:
            logger.warning("Limite de %d pièces jointes atteinte.", MAX_PIECES)
            break
    return fichiers, total


def envoyer_mailgun(data, fichiers):
    """Client httpx synchrone (appelé dans un thread)."""
    return httpx.post(
        API_URL,
        auth=("api", API_KEY),
        data=data,
        files=fichiers or None,
        timeout=httpx.Timeout(60.0, connect=20.0),
    )


# --------------------------------------------------------------------------
# Routes HTTP
# --------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "version": VERSION}


@app.post("/webhook/inbound")
async def inbound(request: Request):
    if not API_KEY or not SIGNING_KEY or not FORWARD_TO:
        logger.error("Configuration incomplète (.env).")
        raise HTTPException(status_code=500, detail="Configuration incomplète")

    form = await request.form()

    # 1. Authenticité de la requête
    if not signature_valide(
        str(form.get("timestamp", "")),
        str(form.get("token", "")),
        str(form.get("signature", "")),
    ):
        logger.warning("Signature Mailgun invalide.")
        raise HTTPException(status_code=403, detail="Signature invalide")

    # 2. Lecture du message
    recipient = normaliser_email(str(form.get("recipient", "")))
    nom_exp, adresse_exp = parseaddr(str(form.get("from", "")))
    expediteur = adresse_exp.strip().lower() or normaliser_email(
        str(form.get("sender", ""))
    )
    if not recipient or not expediteur:
        return Response(status_code=406)

    sujet = nettoyer(str(form.get("subject", "")))
    texte = str(form.get("body-plain", "") or "")
    html = str(form.get("body-html", "") or "")

    fichiers, total = await lire_pieces_jointes(form)
    logger.info(
        "Reçu : champs=%s | attachment-count=%s | fichiers lus=%d | octets=%d",
        sorted(set(form.keys())), form.get("attachment-count"), len(fichiers), total,
    )

    if total > MAX_OCTETS:
        fichiers = []
        texte += "\n\n[Veilix] Pièces jointes non transférées (taille supérieure à 20 Mo)."
        if html:
            html += "<p>[Veilix] Pièces jointes non transférées (taille supérieure à 20 Mo).</p>"

    local, _, domaine = recipient.partition("@")

    if local.startswith("reply+") and domaine == REPLY_DOMAIN:
        # ---- Réponse de l'utilisateur : repart depuis l'alias ----
        ligne = retrouver(local[len("reply+"):])
        if not ligne:
            logger.warning("Token de réponse inconnu.")
            return Response(status_code=406)

        alias, destinataire_original = ligne

        # Seul le propriétaire de l'alias peut répondre en son nom.
        if expediteur != (ALIASES.get(alias) or "").lower():
            logger.warning("Réponse refusée : expéditeur non propriétaire.")
            return Response(status_code=406)

        data = {
            "from": alias,
            "to": destinataire_original,
            "subject": sujet,
            "text": texte,
        }
        sens = "réponse"
    else:
        # ---- Message entrant vers un alias : transfert ----
        destination = ALIASES.get(recipient)
        if not destination:
            logger.warning("Alias non reconnu.")
            return Response(status_code=406)

        token = token_pour(recipient, expediteur)
        nom = nettoyer(nom_exp) or expediteur
        data = {
            "from": formataddr((f"{nom} via Veilix", recipient)),
            "to": destination,
            "subject": sujet,
            "text": texte,
            "h:Reply-To": f"reply+{token}@{REPLY_DOMAIN}",
        }
        sens = "transfert"

    if html:
        data["html"] = html

    # 3. Envoi via l'API Mailgun (client synchrone dans un thread)
    try:
        reponse = await asyncio.to_thread(envoyer_mailgun, data, fichiers)
    except httpx.TimeoutException:
        logger.error("Délai dépassé pendant l'envoi Mailgun.")
        raise HTTPException(status_code=504, detail="Délai dépassé")
    except httpx.HTTPError as exc:
        logger.error("Erreur de connexion à Mailgun : %s", type(exc).__name__)
        raise HTTPException(status_code=502, detail="Erreur de connexion")

    if reponse.status_code not in (200, 202):
        logger.error(
            "Mailgun a refusé l'envoi : HTTP %s - %s",
            reponse.status_code, reponse.text[:300],
        )
        raise HTTPException(status_code=502, detail="Mailgun a refusé l'envoi")

    logger.info(
        "OK %s | pièces jointes envoyées : %d | Mailgun : %s",
        sens, len(fichiers), reponse.text[:200],
    )
    return {"ok": True, "pieces_jointes": len(fichiers)}