import threading
import time

import dns.exception
import dns.resolver

CACHE_SECONDS = 3600
CACHE_MAX_ENTRIES = 5000
LOOKUP_LIFETIME_SECONDS = 2.0
MAX_PARENT_LOOKUPS = 4
POLICIES = ("reject", "quarantine", "none")

_cache: dict[str, tuple[float, str | None]] = {}
_lock = threading.Lock()


def _query(name: str) -> list[str] | None:
    try:
        answers = dns.resolver.resolve(name, "TXT", lifetime=LOOKUP_LIFETIME_SECONDS)
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
        return []
    except dns.exception.DNSException:
        return None
    return ["".join(part.decode("utf-8", "replace") for part in rdata.strings) for rdata in answers]


def _tags(record: str) -> dict[str, str]:
    tags = {}
    for item in record.split(";"):
        name, separator, value = item.partition("=")
        if separator:
            tags[name.strip().lower()] = value.strip().lower()
    return tags


def _record(records: list[str]) -> dict[str, str] | None:
    found = [_tags(record) for record in records if record.strip().lower().startswith("v=dmarc1")]
    return found[0] if len(found) == 1 else None


def _candidates(domain: str) -> list[str]:
    labels = [label for label in domain.strip(".").lower().split(".") if label]
    if len(labels) < 2:
        return []
    parents = [".".join(labels[index:]) for index in range(1, len(labels) - 1)]
    return [".".join(labels), *parents[-MAX_PARENT_LOOKUPS:]]


def _resolve(domain: str) -> tuple[str | None, bool]:
    for index, candidate in enumerate(_candidates(domain)):
        records = _query(f"_dmarc.{candidate}")
        if records is None:
            return None, False
        tags = _record(records)
        if not tags or tags.get("psd") == "y":
            continue
        value = tags.get("sp", tags.get("p")) if index else tags.get("p")
        return (value if value in POLICIES else None), True
    return None, True


def policy(domain: str) -> str | None:
    domain = (domain or "").strip().lower()
    now = time.monotonic()
    with _lock:
        cached = _cache.get(domain)
        if cached and cached[0] > now:
            return cached[1]
    value, definitive = _resolve(domain)
    if definitive:
        with _lock:
            if len(_cache) >= CACHE_MAX_ENTRIES:
                _cache.clear()
            _cache[domain] = (now + CACHE_SECONDS, value)
    return value


def clear_cache() -> None:
    with _lock:
        _cache.clear()
