from app.core.encryption import V2_PREFIX, decrypt, encrypt, is_encrypted
from app.db.session import SessionLocal
from app.models.alias import Alias
from app.models.key import Key


def _needs_conversion(value: str | None) -> bool:
    return bool(value) and not value.startswith(V2_PREFIX)


def main() -> None:
    db = SessionLocal()
    try:
        aliases = 0
        for alias in db.query(Alias).all():
            if not _needs_conversion(alias.destination_email):
                continue
            stored = alias.destination_email
            plain = decrypt(stored, alias.key_version) if is_encrypted(stored) else stored
            alias.destination_email, alias.key_version = encrypt(plain)
            aliases += 1

        keys = 0
        for key in db.query(Key).filter(Key.contact_email.isnot(None)).all():
            if not _needs_conversion(key.contact_email):
                continue
            stored = key.contact_email
            plain = decrypt(stored) if is_encrypted(stored) else stored
            key.contact_email = encrypt(plain)[0]
            keys += 1

        db.commit()
        print(f"Alias convertis : {aliases}")
        print(f"E-mails de récupération convertis : {keys}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
