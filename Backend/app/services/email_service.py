import httpx
from app.core.config import EMAIL_PROVIDER, MAILGUN_API_KEY, MAILGUN_DOMAIN, DOMAIN

def forward_email(to_email: str, sender: str, subject: str, body: str):
    if EMAIL_PROVIDER == "mailgun":
        _send_mailgun(to_email, sender, subject, body)
    else:
        raise NotImplementedError("Provider non supporte")

def _send_mailgun(to_email: str, sender: str, subject: str, body: str):
    response = httpx.post(
        f"https://api.mailgun.net/v3/{MAILGUN_DOMAIN}/messages",
        auth=("api", MAILGUN_API_KEY),
        data={
            "from":    f"Veilix <noreply@{DOMAIN}>",
            "to":      to_email,
            "subject": f"[Veilix] {subject}",
            "text":    f"Email transfere depuis : {sender}\n\n{body}",
        }
    )
    if response.status_code != 200:
        raise Exception(f"Mailgun error: {response.text}")