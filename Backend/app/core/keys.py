import hashlib

STORED_KEY_PREFIX = "h:"


def stored_key_id(key_id: str) -> str:
    return STORED_KEY_PREFIX + hashlib.sha256(key_id.encode("utf-8")).hexdigest()


def is_stored_form(value: str) -> bool:
    return value.startswith(STORED_KEY_PREFIX)
