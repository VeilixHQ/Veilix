import hashlib
import hmac
import os
import secrets
import sys
import time

import httpx
from dotenv import load_dotenv

load_dotenv()

URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8001/webhook/inbound"
CLE = os.environ["MAILGUN_SIGNING_KEY"]

timestamp = str(int(time.time()))
token = secrets.token_hex(16)
signature = hmac.new(
    CLE.encode(), f"{timestamp}{token}".encode(), hashlib.sha256
).hexdigest()

pdf = (
    b"%PDF-1.1\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n"
    b"trailer<</Root 1 0 R>>\n%%EOF\n"
)

data = {
    "timestamp": timestamp,
    "token": token,
    "signature": signature,
    "recipient": "test@mg.veilix.fr",
    "sender": "expediteur@example.com",
    "from": "Expediteur Test <expediteur@example.com>",
    "subject": "Test PJ locale",
    "body-plain": "Bonjour, ceci est un test de pièce jointe en local.",
    "body-html": "<p>Bonjour, ceci est un test de pièce jointe en local.</p>",
    "attachment-count": "1",
}
files = {"attachment-1": ("test.pdf", pdf, "application/pdf")}

r = httpx.post(URL, data=data, files=files, timeout=90)
print("Code HTTP :", r.status_code)
print("Réponse   :", r.text)