import argparse

from app.core.encryption import hash_email
from app.db.session import SessionLocal
from app.services.key_service import get_key_by_id
from app.services.destination_service import mark_verified


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--key-id", required=True)
    parser.add_argument("--email", required=True)
    args = parser.parse_args()

    db = SessionLocal()
    try:
        key = get_key_by_id(db, args.key_id)
        if not key:
            print("Clé introuvable.")
            return
        activated = mark_verified(db, key.id, hash_email(args.email))
        print(f"Adresse confirmée. Alias activés : {activated}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
