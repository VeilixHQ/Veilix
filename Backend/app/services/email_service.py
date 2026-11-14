import httpx
from app.core.config import EMAIL_PROVIDER, MAILGUN_API_KEY, MAILGUN_API_URL, MAILGUN_DOMAIN, DOMAIN

def forward_email(to_email: str, sender: str, subject: str, body: str):
    if EMAIL_PROVIDER == "mailgun":
        _send_mailgun(to_email, sender, subject, body)
    else:
        raise NotImplementedError("Provider non supporte")

def send_destination_confirmation(to_email: str, confirm_url: str):
    if EMAIL_PROVIDER != "mailgun":
        raise NotImplementedError("Provider non supporte")
    _post_mailgun({
        "from":       f"Veilix <noreply@{MAILGUN_DOMAIN}>",
        "to":         to_email,
        "subject":    "Confirmez votre adresse de destination Veilix",
        "text":       _confirmation_text(confirm_url),
        "o:tracking": "no",
    })

def _confirmation_text(confirm_url: str) -> str:
    return (
        "Bonjour,\n\n"
        "Une demande a été faite pour transférer les e-mails d'un alias Veilix vers cette adresse.\n\n"
        "Si vous êtes à l'origine de cette demande, confirmez l'adresse en ouvrant ce lien (valable 48 heures) :\n"
        f"{confirm_url}\n\n"
        "Si ce n'est pas vous, ignorez ce message : aucun e-mail ne vous sera transféré.\n\n"
        "--\n\n"
        "Hello,\n\n"
        "A request was made to forward emails from a Veilix alias to this address.\n\n"
        "If you made this request, confirm the address by opening this link (valid for 48 hours):\n"
        f"{confirm_url}\n\n"
        "If this was not you, ignore this message: no email will be forwarded to you.\n\n"
        "Veilix"
    )

def _send_mailgun(to_email: str, sender: str, subject: str, body: str):
    _post_mailgun({
        "from":    f"Veilix <noreply@{DOMAIN}>",
        "to":      to_email,
        "subject": f"[Veilix] {subject}",
        "text":    f"Email transfere depuis : {sender}\n\n{body}",
    })

def _post_mailgun(data: dict):
    response = httpx.post(
        f"{MAILGUN_API_URL}/v3/{MAILGUN_DOMAIN}/messages",
        auth=("api", MAILGUN_API_KEY),
        data=data,
        timeout=httpx.Timeout(30.0, connect=10.0),
    )
    if response.status_code not in (200, 202):
        raise Exception(f"Mailgun error: HTTP {response.status_code}")