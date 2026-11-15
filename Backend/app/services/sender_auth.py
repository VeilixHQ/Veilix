import json
from email.utils import parseaddr

SPF_HEADER = "x-mailgun-spf"
DKIM_RESULT_HEADER = "x-mailgun-dkim-check-result"
DKIM_SIGNATURE_HEADER = "dkim-signature"


def parse_headers(raw) -> list[tuple[str, str]]:
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except ValueError:
            return []
    if not isinstance(raw, list):
        return []
    return [
        (item[0], item[1])
        for item in raw
        if isinstance(item, (list, tuple)) and len(item) == 2 and all(isinstance(part, str) for part in item)
    ]


def _values(headers: list[tuple[str, str]], name: str) -> list[str]:
    return [value.strip() for key, value in headers if key.strip().lower() == name]


def _domain(address: str) -> str:
    return parseaddr(address or "")[1].strip().lower().rpartition("@")[2]


def _aligned(first: str, second: str) -> bool:
    return bool(first and second) and (first == second or first.endswith("." + second) or second.endswith("." + first))


def _signing_domain(signature: str) -> str:
    for tag in signature.split(";"):
        name, _, value = tag.strip().partition("=")
        if name.strip().lower() == "d":
            return "".join(value.split()).lower()
    return ""


def _single_verdict(headers: list[tuple[str, str]], name: str) -> str | None:
    values = _values(headers, name)
    if len(values) > 1:
        raise ValueError("verdict ambigu")
    return values[0].lower() if values else None


def has_verdict(headers: list[tuple[str, str]]) -> bool:
    return bool(_values(headers, SPF_HEADER) or _values(headers, DKIM_RESULT_HEADER))


def sender_authenticated(headers: list[tuple[str, str]], from_address: str, envelope_sender: str) -> bool:
    try:
        spf = _single_verdict(headers, SPF_HEADER)
        dkim = _single_verdict(headers, DKIM_RESULT_HEADER)
    except ValueError:
        return False
    from_domain = _domain(from_address)
    if not from_domain:
        return False
    if spf == "pass" and _aligned(_domain(envelope_sender), from_domain):
        return True
    if dkim == "pass":
        domains = [_signing_domain(value) for value in _values(headers, DKIM_SIGNATURE_HEADER)]
        if domains and all(_aligned(domain, from_domain) for domain in domains):
            return True
    return False


def obviously_spoofed(headers: list[tuple[str, str]]) -> bool:
    try:
        spf = _single_verdict(headers, SPF_HEADER)
        dkim = _single_verdict(headers, DKIM_RESULT_HEADER)
    except ValueError:
        return False
    return spf == "fail" and dkim != "pass"
