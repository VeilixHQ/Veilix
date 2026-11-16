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


def _public_https(url: str) -> bool:
    return url.startswith("https://") and not any(host in url for host in ("localhost", "127.0.0.1", "[::1]"))


if IS_PRODUCTION and not (_public_https(FRONTEND_URL) and CORS_ORIGINS and all(_public_https(origin) for origin in CORS_ORIGINS)):
    raise RuntimeError("Configuration de production incomplète : FRONTEND_URL et CORS_ORIGINS doivent être des adresses https publiques.")
if IS_PRODUCTION and not CLIENT_IP_HEADER:
    raise RuntimeError("Configuration de production incomplète : CLIENT_IP_HEADER est obligatoire derrière le proxy de l'hébergeur.")


def _env_datetime(name: str, default: str = ""):
    from datetime import datetime, timezone
    raw = os.getenv(name)
    raw = (default if raw is None else raw).strip()
    if not raw:
        return None
    value = datetime.fromisoformat(raw)
    if value.tzinfo is not None:
        value = value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def _env_flag(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None or not raw.strip():
        return default
    return raw.strip().lower() in ("1", "true", "yes", "on")


BETA_PRIVATE_INVITE_TOKEN    = os.getenv("BETA_PRIVATE_INVITE_TOKEN", "").strip()
BETA_PRIVATE_SEATS           = int(os.getenv("BETA_PRIVATE_SEATS", "15"))
BETA_PRIVATE_OPENS_AT        = _env_datetime("BETA_PRIVATE_OPENS_AT", "2026-12-01T00:00:00+01:00")
BETA_PRIVATE_SIGNUPS_CLOSE_AT = _env_datetime("BETA_PRIVATE_SIGNUPS_CLOSE_AT", "2027-01-01T00:00:00+01:00")
BETA_PRIVATE_ENDS_AT         = _env_datetime("BETA_PRIVATE_ENDS_AT", "2027-01-16T00:00:00+01:00")
BETA_PUBLIC_OPENS_AT         = _env_datetime("BETA_PUBLIC_OPENS_AT", "2027-02-01T00:00:00+01:00")
BETA_PUBLIC_SIGNUPS_CLOSE_AT = _env_datetime("BETA_PUBLIC_SIGNUPS_CLOSE_AT")
BETA_PUBLIC_WAVE1_SEATS      = int(os.getenv("BETA_PUBLIC_WAVE1_SEATS", "10"))
BETA_PUBLIC_WAVE2_SEATS      = int(os.getenv("BETA_PUBLIC_WAVE2_SEATS", "20"))
BETA_PUBLIC_WAVE2_AFTER_DAYS = int(os.getenv("BETA_PUBLIC_WAVE2_AFTER_DAYS", "14"))
BETA_PUBLIC_WAVE2_HOLD       = _env_flag("BETA_PUBLIC_WAVE2_HOLD", False)
BETA_PUBLIC_ENDS_AT          = _env_datetime("BETA_PUBLIC_ENDS_AT", "2027-03-01T00:00:00+01:00")
LAUNCH_AT                    = _env_datetime("LAUNCH_AT", "2027-03-01T00:00:00+01:00")
BETA_CODE_VALID_DAYS         = int(os.getenv("BETA_CODE_VALID_DAYS", "7"))
BETA_SCHEDULER_ENABLED       = _env_flag("BETA_SCHEDULER_ENABLED", True)
BETA_SCHEDULER_INTERVAL_SECONDS = int(os.getenv("BETA_SCHEDULER_INTERVAL_SECONDS", "600"))
ADMIN_ALLOWED_IPS            = {ip.strip() for ip in os.getenv("ADMIN_ALLOWED_IPS", "").split(",") if ip.strip()}
BETA_SIGNUP_GLOBAL_PER_HOUR  = int(os.getenv("BETA_SIGNUP_GLOBAL_PER_HOUR", "60"))
BETA_SIGNUP_PER_IP_PER_DAY   = int(os.getenv("BETA_SIGNUP_PER_IP_PER_DAY", "10"))

FORWARD_LIMIT_PER_ALIAS_HOUR = int(os.getenv("FORWARD_LIMIT_PER_ALIAS_HOUR", "60"))
FORWARD_LIMIT_PER_KEY_DAY    = int(os.getenv("FORWARD_LIMIT_PER_KEY_DAY", "1000"))
REPLY_LIMIT_PER_KEY_HOUR     = int(os.getenv("REPLY_LIMIT_PER_KEY_HOUR", "30"))
REPLY_LIMIT_PER_KEY_DAY      = int(os.getenv("REPLY_LIMIT_PER_KEY_DAY", "100"))
REPLY_REQUIRE_AUTHENTICATED_SENDER = _env_flag("REPLY_REQUIRE_AUTHENTICATED_SENDER", False)
MAX_FORWARD_HOPS             = int(os.getenv("MAX_FORWARD_HOPS", "3"))
DMARC_ENFORCEMENT            = _env_flag("DMARC_ENFORCEMENT", True)
SPAM_DROP_SCORE              = float(os.getenv("SPAM_DROP_SCORE", "8"))
WEBHOOK_BAD_SIGNATURES_PER_HOUR = int(os.getenv("WEBHOOK_BAD_SIGNATURES_PER_HOUR", "20"))
