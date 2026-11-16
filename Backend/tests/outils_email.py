import json
import secrets
from dataclasses import dataclass, field
from email import message_from_bytes, policy
from email.message import EmailMessage
from email.utils import formatdate, parseaddr

import httpx

from tests.conftest import entetes, inscrire, jeton_de, lien_de_confirmation, signature_mailgun

CORRESPONDANT = "Jean Dupont <jean.dupont@exemple.org>"
ADRESSE_REELLE = "alice@example.com"
SPF_OK = [["X-Mailgun-Spf", "Pass"]]
DOMAINE_D_ENVOI = "mg.veilix-tests.fr"


def source_brute(data: dict, files: list) -> bytes:
    message = EmailMessage(policy=policy.SMTP)
    message["Received"] = f"by mta.mailgun.test with HTTP id {secrets.token_hex(8)}; {formatdate()}"
    message["Return-Path"] = f"<bounce+{secrets.token_hex(6)}@{DOMAINE_D_ENVOI}>"
    message["From"] = data["from"]
    message["To"] = data["to"]
    message["Subject"] = data["subject"]
    message["Date"] = formatdate()
    for nom, valeur in data.items():
        if nom.startswith("h:"):
            message[nom[2:]] = valeur
    if "Message-Id" not in message:
        message["Message-Id"] = f"<{secrets.token_hex(16)}@{DOMAINE_D_ENVOI}>"
    message["X-Mailgun-Sending-Ip"] = "203.0.113.200"
    message.set_content(data.get("text", ""))
    if data.get("html"):
        message.add_alternative(data["html"], subtype="html")
    for _, (nom, contenu, type_mime) in files:
        principal, _, secondaire = type_mime.partition("/")
        if principal not in ("application", "image", "audio", "video", "text"):
            principal, secondaire = "application", "octet-stream"
        if principal == "text":
            principal, secondaire = "application", f"x-texte-{secondaire}"
        message.add_attachment(contenu, maintype=principal or "application", subtype=secondaire or "octet-stream", filename=nom)
    return message.as_bytes()


@dataclass
class Envoi:
    data: dict
    files: list
    brut: bytes

    @property
    def message(self):
        return message_from_bytes(self.brut, policy=policy.default)

    def parties_decodees(self) -> list[bytes]:
        return [partie.get_payload(decode=True) or b"" for partie in self.message.walk() if not partie.is_multipart()]

    def contient(self, fragment: str) -> bool:
        cible = fragment.lower().encode()
        return cible in self.brut.lower() or any(cible in partie.lower() for partie in self.parties_decodees())

    def piece(self, nom: str) -> bytes:
        for partie in self.message.iter_attachments():
            if partie.get_filename() == nom:
                return partie.get_payload(decode=True)
        raise AssertionError(f"pièce jointe absente : {nom}")


@dataclass
class FauxMailgun:
    messages: list[Envoi] = field(default_factory=list)
    pannes: list = field(default_factory=list)
    suppressions: list[str] = field(default_factory=list)
    appels: int = 0

    def post(self, url, auth=None, data=None, files=None, timeout=None):
        self.appels += 1
        assert url.endswith(f"/v3/{DOMAINE_D_ENVOI}/messages")
        assert auth == ("api", "cle-de-test")
        if self.pannes:
            panne = self.pannes.pop(0)
            if isinstance(panne, Exception):
                raise panne
            return httpx.Response(panne, json={"message": "erreur simulée"})
        fichiers = list(files or [])
        self.messages.append(Envoi(dict(data), fichiers, source_brute(data, fichiers)))
        return httpx.Response(200, json={"id": f"<{secrets.token_hex(8)}@{DOMAINE_D_ENVOI}>", "message": "Queued. Thank you."})

    def delete(self, url, auth=None, timeout=None):
        self.suppressions.append(url.split(f"/v3/{DOMAINE_D_ENVOI}/", 1)[1])
        return httpx.Response(200, json={"message": "ok"})

    def vider(self) -> None:
        self.messages.clear()
        self.appels = 0

    def envoyes_a(self, adresse: str) -> list[Envoi]:
        return [envoi for envoi in self.messages if parseaddr(envoi.data["to"])[1].lower() == adresse.lower()]


def creer_alias(client, mailgun: FauxMailgun, destination: str = ADRESSE_REELLE, cle: str | None = None) -> dict:
    cle = cle or inscrire(client)
    reponse = client.post("/alias", headers=entetes(cle), json={"destination_email": destination})
    assert reponse.status_code == 200, reponse.text
    alias = reponse.json()
    if alias["status"] == "pending":
        lien = lien_de_confirmation(mailgun.envoyes_a(destination)[-1].data)
        assert client.post("/destination/confirm", json={"token": jeton_de(lien)}).status_code == 200
    mailgun.vider()
    return {"cle": cle, **alias, "status": "active"}


def recevoir(client, destinataire, expediteur=CORRESPONDANT, entetes_mailgun=None, fichiers=None, signature=None, **champs):
    data = {
        **(signature or signature_mailgun()),
        "recipient": destinataire,
        "from": expediteur,
        "sender": parseaddr(expediteur)[1],
        "message-headers": json.dumps(SPF_OK if entetes_mailgun is None else entetes_mailgun),
        "subject": "Facture de novembre",
        "body-plain": "Bonjour, voici la facture.",
        "body-html": "<p>Bonjour, voici la facture.</p>",
        **champs,
    }
    return client.post("/email/inbound", data=data, files=fichiers)


def evenement(client, nom, destinataire, expediteur, gravite=None, raison=None, signature=None):
    donnees = {
        "event": nom,
        "recipient": destinataire,
        "message": {"headers": {"from": expediteur, "to": destinataire, "subject": "Facture de novembre"}},
    }
    if gravite:
        donnees["severity"] = gravite
    if raison:
        donnees["reason"] = raison
    return client.post("/email/events", json={"signature": signature or signature_mailgun(), "event-data": donnees})


def entetes_transmis(envoi: Envoi) -> list[list[str]]:
    return [[nom, valeur] for nom, valeur in envoi.message.items()]
