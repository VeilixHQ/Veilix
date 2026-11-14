import asyncio
import hashlib
import hmac
import logging
import os
import secrets
import sqlite3
import threading
import time
from collections import OrderedDict
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
MAX_OCTETS = 20 * 1024 * 1024
MAX_CORPS = 40 * 1024 * 1024
MAX_AGE_SIGNATURE = 12 * 3600
MAX_TOKENS_SUIVIS = 50000

_verrou_tokens = threading.Lock()
_tokens_traites: OrderedDict[str, float] = OrderedDict()

ALIASES = {
    "test@mg.veilix.fr": FORWARD_TO,
}

app = FastAPI(title="Veilix Inbound Webhook")


@app.on_event("startup")
async def bannière():
    logger.info("=== Veilix inbound %s chargé (pièces jointes + réponses inversées) ===", VERSION)


def normaliser_email(value: str) -> str:
    _, address = parseaddr(value or "")
    return address.strip().lower()


def nettoyer(valeur: str) -> str:
    return " ".join((valeur or "").split())


def signature_valide(timestamp: str, token: str, signature: str) -> bool:
    if not all((SIGNING_KEY, timestamp, token, signature)):
        return False
    try:
        emis_a = int(timestamp)
    except ValueError:
        return False
    if abs(time.time() - emis_a) > MAX_AGE_SIGNATURE:
        return False
    attendu = hmac.new(
        SIGNING_KEY.encode("utf-8"),
        msg=f"{timestamp}{token}".encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(attendu.encode("utf-8"), signature.encode("utf-8"))


def reserver_token(token: str) -> bool:
    maintenant = time.time()
    with _verrou_tokens:
        while _tokens_traites:
            plus_ancien, reserve_a = next(iter(_tokens_traites.items()))
            if len(_tokens_traites) > MAX_TOKENS_SUIVIS or reserve_a < maintenant - MAX_AGE_SIGNATURE:
                _tokens_traites.pop(plus_ancien, None)
            else:
                break
        if token in _tokens_traites:
            return False
        _tokens_traites[token] = maintenant
        return True


def liberer_token(token: str) -> None:
    with _verrou_tokens:
        _tokens_traites.pop(token, None)


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


async def lire_pieces_jointes(form):
    fichiers, total = [], 0
    for cle, valeur in form.multi_items():
        if not (hasattr(valeur, "read") and hasattr(valeur, "filename")):
            continue
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
    return httpx.post(
        API_URL,
        auth=("api", API_KEY),
        data=data,
        files=fichiers or None,
        timeout=httpx.Timeout(60.0, connect=20.0),
    )


@app.get("/health")
async def health():
    return {"status": "ok", "version": VERSION}


@app.post("/webhook/inbound")
async def inbound(request: Request):
    if not API_KEY or not SIGNING_KEY or not FORWARD_TO:
        logger.error("Configuration incomplète (.env).")
        raise HTTPException(status_code=500, detail="Configuration incomplète")

    taille_annoncee = request.headers.get("content-length", "")
    if taille_annoncee.isdigit() and int(taille_annoncee) > MAX_CORPS:
        raise HTTPException(status_code=413, detail="Message trop volumineux")

    form = await request.form()

    jeton = str(form.get("token", ""))
    if not signature_valide(
        str(form.get("timestamp", "")),
        jeton,
        str(form.get("signature", "")),
    ):
        logger.warning("Signature Mailgun invalide.")
        raise HTTPException(status_code=403, detail="Signature invalide")
    if not reserver_token(jeton):
        logger.warning("Webhook Mailgun rejoué.")
        raise HTTPException(status_code=403, detail="Signature invalide")

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
        ligne = retrouver(local[len("reply+"):])
        if not ligne:
            logger.warning("Token de réponse inconnu.")
            return Response(status_code=406)

        alias, destinataire_original = ligne

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

    try:
        reponse = await asyncio.to_thread(envoyer_mailgun, data, fichiers)
    except httpx.TimeoutException:
        liberer_token(jeton)
        logger.error("Délai dépassé pendant l'envoi Mailgun.")
        raise HTTPException(status_code=504, detail="Délai dépassé")
    except httpx.HTTPError as exc:
        liberer_token(jeton)
        logger.error("Erreur de connexion à Mailgun : %s", type(exc).__name__)
        raise HTTPException(status_code=502, detail="Erreur de connexion")

    if reponse.status_code not in (200, 202):
        liberer_token(jeton)
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