import re
from urllib.parse import quote

TEXT_TYPES = ("application/ics", "application/json", "application/xml", "message/rfc822")
TEXT_EXTENSIONS = (".ics", ".ifb", ".vcf", ".vcs", ".eml", ".txt", ".csv", ".htm", ".html", ".md", ".xml", ".json")
CALENDAR_EXTENSIONS = (".ics", ".ifb", ".vcs")
MAX_FILENAME_LENGTH = 200
_FOLDING = re.compile(rb"\r?\n[ \t]")


def _variants(address: str) -> list[str]:
    encoded = quote(address, safe="")
    return list(dict.fromkeys((address, encoded, address.replace("@", "=40"))))


def _pattern(addresses: list[str]) -> str:
    return "|".join(re.escape(variant) for address in addresses for variant in _variants(address))


def is_text_like(filename: str, content_type: str) -> bool:
    kind = (content_type or "").split(";")[0].strip().lower()
    return kind.startswith("text/") or kind in TEXT_TYPES or (filename or "").lower().endswith(TEXT_EXTENSIONS)


def is_calendar(filename: str, content_type: str) -> bool:
    kind = (content_type or "").split(";")[0].strip().lower()
    return kind in ("text/calendar", "application/ics") or (filename or "").lower().endswith(CALENDAR_EXTENSIONS)


def safe_filename(filename: str, fallback: str) -> str:
    name = re.split(r"[\/]", filename or "")[-1]
    name = "".join(ch for ch in name if ch.isprintable()).strip().strip(".")
    return name[:MAX_FILENAME_LENGTH] or fallback


class Scrubber:
    def __init__(self, replacements: dict[str, str]):
        self._replacements = {source.lower(): target for source, target in replacements.items() if source}
        lookup = {}
        for source, target in self._replacements.items():
            for variant in _variants(source):
                lookup[variant.lower()] = target
        self._lookup = lookup
        pattern = _pattern(list(self._replacements))
        self._text = re.compile(pattern, re.IGNORECASE) if pattern else None
        self._bytes = re.compile(pattern.encode("utf-8"), re.IGNORECASE) if pattern else None

    def text(self, value: str) -> str:
        if not value or not self._text:
            return value or ""
        return self._text.sub(lambda match: self._lookup[match.group(0).lower()], value)

    def content(self, value: bytes) -> bytes:
        if not value or not self._bytes:
            return value
        return self._bytes.sub(lambda match: self._lookup[match.group(0).decode("utf-8").lower()].encode("utf-8"), value)

    def attachment(self, item: tuple[str, bytes, str], index: int) -> tuple[str, bytes, str]:
        filename, content, content_type = item
        name = safe_filename(self.text(filename), f"piece-{index}")
        if is_calendar(filename, content_type):
            content = _FOLDING.sub(b"", content)
        if is_text_like(filename, content_type):
            content = self.content(content)
        return name, content, content_type


def redirect_organizer(item: tuple[str, bytes, str], organizer: str, reply_address: str) -> tuple[str, bytes, str]:
    filename, content, content_type = item
    if not organizer or not is_calendar(filename, content_type):
        return item
    pattern = re.compile(
        rb"(?im)^(ORGANIZER\b[^\r\n]*?:mailto:)" + re.escape(organizer.encode("utf-8")) + rb"[ \t]*(?=\r?$)"
    )
    rewritten = pattern.sub(lambda match: match.group(1) + reply_address.encode("utf-8"), _FOLDING.sub(b"", content))
    return filename, rewritten, content_type
