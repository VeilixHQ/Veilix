import argparse
import hashlib
import hmac
import secrets
import time

import httpx

from app.core.config import MAILGUN_SIGNING_KEY

PDF = (
    b"%PDF-1.1\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n"
    b"trailer<</Root 1 0 R>>\n%%EOF\n"
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Simule un e-mail entrant signé avec une pièce jointe.")
    parser.add_argument("destinataire", help="Alias ou adresse de réponse reply+...")
    parser.add_argument("--expediteur", default="Expediteur Test <expediteur@example.com>")
    parser.add_argument("--url", default="http://127.0.0.1:8000/email/inbound")
    args = parser.parse_args()

    if not MAILGUN_SIGNING_KEY:
        raise SystemExit("MAILGUN_SIGNING_KEY manquante dans le .env")

    timestamp = str(int(time.time()))
    token = secrets.token_hex(25)
    signature = hmac.new(MAILGUN_SIGNING_KEY.encode(), f"{timestamp}{token}".encode(), hashlib.sha256).hexdigest()
    data = {
        "timestamp": timestamp,
        "token": token,
        "signature": signature,
        "recipient": args.destinataire,
        "sender": "expediteur@example.com",
        "from": args.expediteur,
        "subject": "Test de pièce jointe",
        "body-plain": "Bonjour, ceci est un test de pièce jointe.",
        "body-html": "<p>Bonjour, ceci est un test de pièce jointe.</p>",
    }
    response = httpx.post(args.url, data=data, files={"attachment-1": ("test.pdf", PDF, "application/pdf")}, timeout=90)
    print("Code HTTP :", response.status_code)
    print("Réponse   :", response.text)


if __name__ == "__main__":
    main()
