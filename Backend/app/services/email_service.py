import logging
from urllib.parse import quote

import httpx
from app.core.config import EMAIL_PROVIDER, MAILGUN_API_KEY, MAILGUN_API_URL, MAILGUN_DOMAIN

logger = logging.getLogger("veilix.mailgun")

REJECTED_STATUS = (400, 413)
SUPPRESSION_LISTS = ("bounces", "complaints", "unsubscribes")


class MailgunError(Exception):
    pass


class MailgunRejected(MailgunError):
    pass


def send_message(data: dict, files: list | None = None) -> None:
    if EMAIL_PROVIDER != "mailgun":
        raise NotImplementedError("Provider non supporte")
    _post_mailgun(data, files)


def send_destination_confirmation(to_email: str, confirm_url: str):
    send_message({
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


def _post_mailgun(data: dict, files: list | None = None):
    response = httpx.post(
        f"{MAILGUN_API_URL}/v3/{MAILGUN_DOMAIN}/messages",
        auth=("api", MAILGUN_API_KEY),
        data=data,
        files=files or None,
        timeout=httpx.Timeout(60.0, connect=10.0),
    )
    if response.status_code in (200, 202):
        return
    if response.status_code in REJECTED_STATUS:
        raise MailgunRejected(f"HTTP {response.status_code}")
    raise MailgunError(f"HTTP {response.status_code}")


def _delete_mailgun(path: str) -> None:
    response = httpx.delete(
        f"{MAILGUN_API_URL}/v3/{MAILGUN_DOMAIN}/{path}",
        auth=("api", MAILGUN_API_KEY),
        timeout=httpx.Timeout(10.0, connect=5.0),
    )
    if response.status_code not in (200, 404):
        raise MailgunError(f"HTTP {response.status_code}")


def clear_suppression(address: str, lists: tuple[str, ...] = SUPPRESSION_LISTS) -> None:
    for name in lists:
        try:
            _delete_mailgun(f"{name}/{quote(address, safe='')}")
        except Exception as exc:
            logger.error("Retrait de la liste de suppression impossible : %s", type(exc).__name__)


PHASE_NAMES = {"private": "bêta privée", "public": "bêta publique"}
SIGNATURE = "\n\nL'équipe Veilix"


def _send_text(to_email: str, subject: str, text: str) -> None:
    send_message({
        "from":       f"Veilix <noreply@{MAILGUN_DOMAIN}>",
        "to":         to_email,
        "subject":    subject,
        "text":       text + SIGNATURE,
        "o:tracking": "no",
    })


def send_beta_code(to_email: str, phase: str, code: str, access_url: str, expires_on: str) -> None:
    payment = (
        "Après la création de votre clé, vous choisirez votre offre (Pro ou Pack de lancement) pour activer l'accès.\n\n"
        if phase == "public" else
        "Pendant la bêta privée, le Pack de lancement vous est offert, sans carte bancaire.\n\n"
    )
    _send_text(to_email, "Votre code d'accès à la bêta Veilix", (
        "Bonjour,\n\n"
        f"Bienvenue dans la {PHASE_NAMES[phase]} de Veilix. Voici votre code personnel :\n\n"
        f"    {code}\n\n"
        f"Il est valable jusqu'au {expires_on}. Saisissez-le ici pour créer votre clé :\n"
        f"{access_url}\n\n"
        f"{payment}"
        "Ce code est strictement personnel : le partager, le vendre ou le publier entraîne sa révocation immédiate.\n"
        "Pendant la bêta, un premier retour est attendu sous 7 jours après l'activation, puis à intervalles réguliers."
    ))


def send_beta_waitlist(to_email: str, phase: str, position: int) -> None:
    _send_text(to_email, "Vous êtes sur la liste d'attente de la bêta Veilix", (
        "Bonjour,\n\n"
        f"Merci pour votre inscription à la {PHASE_NAMES[phase]} de Veilix. Toutes les places sont prises pour le moment.\n\n"
        f"Vous êtes en position {position} sur la liste d'attente. Dès qu'une place se libère, "
        "votre code personnel vous est envoyé automatiquement à cette adresse."
    ))


def send_beta_code_expired(to_email: str, signup_url: str) -> None:
    _send_text(to_email, "Votre code d'accès Veilix a expiré", (
        "Bonjour,\n\n"
        "Votre code d'accès à la bêta n'a pas été utilisé à temps : il a expiré et votre place a été proposée à la personne suivante.\n\n"
        f"Vous pouvez vous réinscrire ici pour reprendre une place dans la liste d'attente :\n{signup_url}"
    ))


def send_feedback_due(to_email: str, due_on: str, form_url: str, final: bool) -> None:
    kind = "votre retour final" if final else "votre retour"
    _send_text(to_email, f"C'est le moment d'envoyer {kind} sur la bêta Veilix", (
        "Bonjour,\n\n"
        f"{kind[0].upper()}{kind[1:]} sur la bêta est attendu au plus tard le {due_on}.\n\n"
        f"Le formulaire prend quelques minutes. Ce lien l'ouvre directement dans votre tableau de bord :\n{form_url}\n\n"
        "Sans retour à cette date, vous recevrez un rappel, puis l'accès à la bêta sera suspendu 48 heures plus tard."
    ))


def send_feedback_reminder(to_email: str, due_on: str, form_url: str) -> None:
    _send_text(to_email, "Rappel : votre retour sur la bêta Veilix est attendu", (
        "Bonjour,\n\n"
        f"Votre retour sur la bêta était attendu le {due_on} et nous ne l'avons pas encore reçu.\n\n"
        f"Il ne prend que quelques minutes. Ce lien ouvre directement le formulaire :\n{form_url}\n\n"
        "Sans retour dans les 48 heures, votre accès à la bêta sera suspendu automatiquement. "
        "Il sera réactivé dès réception de votre retour si la bêta est toujours en cours.\n\n"
        "Un problème technique vous empêche de répondre ? Écrivez-nous en réponse à ce message."
    ))


def send_beta_suspended(to_email: str, form_url: str) -> None:
    _send_text(to_email, "Votre accès à la bêta Veilix est suspendu", (
        "Bonjour,\n\n"
        "Nous n'avons pas reçu votre retour dans les 48 heures suivant le rappel : votre accès à la bêta est suspendu. "
        "Vos alias et vos données sont conservés.\n\n"
        f"Envoyez votre retour avec ce lien pour réactiver l'accès immédiatement :\n{form_url}"
    ))


def send_beta_reactivated(to_email: str) -> None:
    _send_text(to_email, "Votre accès à la bêta Veilix est réactivé", (
        "Bonjour,\n\n"
        "Merci pour votre retour. Votre accès à la bêta est de nouveau actif."
    ))


def send_beta_closing(to_email: str, phase: str, launch_on: str | None = None) -> None:
    launch = f"le {launch_on}" if launch_on else "prochainement"
    next_step = (
        f"Votre Pack de lancement reste actif jusqu'au lancement officiel, {launch}. Il continue ensuite avec 3 mois offerts : "
        "il vous suffira d'enregistrer une carte bancaire, aucun prélèvement n'aura lieu pendant ces 3 mois. "
        "Sans carte enregistrée, l'accès sera coupé."
        if phase == "private" else
        f"Votre abonnement continue normalement. Le lancement officiel de Veilix a lieu {launch}."
    )
    _send_text(to_email, f"Fin de la {PHASE_NAMES[phase]} Veilix", (
        "Bonjour,\n\n"
        f"La {PHASE_NAMES[phase]} de Veilix est terminée. Merci pour votre participation et vos retours.\n\n"
        f"{next_step}\n\n"
        "Vous pouvez à tout moment quitter Veilix et supprimer vos données depuis votre tableau de bord."
    ))


def send_reply_undelivered(to_email: str, alias_email: str, correspondent: str) -> None:
    _send_text(to_email, "Votre réponse via Veilix n'a pas pu être remise", (
        "Bonjour,\n\n"
        f"La réponse envoyée depuis votre alias {alias_email} à {correspondent} n'a pas pu être remise : "
        "le serveur du destinataire l'a refusée.\n\n"
        "Vérifiez l'adresse de votre correspondant. Votre adresse personnelle ne lui a pas été communiquée.\n\n"
        "--\n\n"
        f"Your reply sent from your alias {alias_email} to {correspondent} could not be delivered: "
        "the recipient's server refused it. Your personal address was not disclosed."
    ))


def send_alias_disabled_after_complaint(to_email: str, alias_email: str, dashboard_url: str) -> None:
    _send_text(to_email, "Un alias Veilix a été désactivé après un signalement", (
        "Bonjour,\n\n"
        f"Un message transféré par votre alias {alias_email} a été signalé comme indésirable depuis votre messagerie. "
        "Pour protéger la remise de vos autres messages, cet alias a été désactivé.\n\n"
        "Pour ne plus recevoir un expéditeur, désactivez l'alias concerné plutôt que de signaler le message : "
        "un signalement pénalise tous vos alias.\n\n"
        f"Vous pouvez réactiver l'alias depuis votre tableau de bord :\n{dashboard_url}\n\n"
        "--\n\n"
        f"A message forwarded by your alias {alias_email} was reported as spam from your mailbox, so this alias has been disabled. "
        "To stop a sender, disable the alias instead of reporting the message. "
        f"You can re-enable it from your dashboard:\n{dashboard_url}"
    ))
