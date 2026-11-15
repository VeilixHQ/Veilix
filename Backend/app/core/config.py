import os
from dotenv import load_dotenv

load_dotenv(encoding="utf-8-sig")

DATABASE_URL        = os.getenv("DATABASE_URL")
DOMAIN              = os.getenv("DOMAIN", "veilix.fr")
EMAIL_PROVIDER      = os.getenv("EMAIL_PROVIDER", "mailgun")
MAILGUN_API_KEY     = os.getenv("MAILGUN_API_KEY")
MAILGUN_DOMAIN      = os.getenv("MAILGUN_DOMAIN")
MAILGUN_SIGNING_KEY = os.getenv("MAILGUN_SIGNING_KEY", "").strip()
MAILGUN_API_URL     = os.getenv("MAILGUN_API_URL", "https://api.eu.mailgun.net").rstrip("/")
REPLY_DOMAIN        = (os.getenv("REPLY_DOMAIN") or MAILGUN_DOMAIN or DOMAIN).strip().lower()
INTERNAL_DOMAINS    = {d.strip().lower() for d in (DOMAIN, MAILGUN_DOMAIN, REPLY_DOMAIN) if d and d.strip()}
FRONTEND_URL        = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
ENCRYPTION_KEY      = os.getenv("ENCRYPTION_KEY")
HMAC_SECRET         = os.getenv("HMAC_SECRET")
ADMIN_KEY_IDS       = os.getenv("ADMIN_KEY_IDS", "")
APP_ENV             = os.getenv("APP_ENV", "development").strip().lower()
IS_PRODUCTION       = APP_ENV == "production"
CLIENT_IP_HEADER    = os.getenv("CLIENT_IP_HEADER", "").strip()
CORS_ORIGINS        = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if origin.strip()
]

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL manquante dans les variables d'environnement (.env).")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql://" + DATABASE_URL[len("postgres://"):]
if IS_PRODUCTION and not all((ENCRYPTION_KEY, HMAC_SECRET, MAILGUN_SIGNING_KEY, MAILGUN_API_KEY, MAILGUN_DOMAIN)):
    raise RuntimeError("Configuration de production incomplète : ENCRYPTION_KEY, HMAC_SECRET et les variables Mailgun sont obligatoires.")
