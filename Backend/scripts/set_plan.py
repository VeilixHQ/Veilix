import argparse

from app.db.session import SessionLocal
from app.services.key_service import get_key_by_id


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--key-id", required=True)
    parser.add_argument("--plan", choices=["pro", "launch"])
    parser.add_argument("--status", help="Ex. active (valeur utilisée par ton paywall)")
    parser.add_argument("--show", action="store_true", help="Afficher plan et statut sans rien modifier")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        key = get_key_by_id(db, args.key_id)
        if not key:
            print("Clé introuvable.")
            return

        print(f"Avant : plan={key.plan!r}, status={key.status!r}")
        if args.show or (not args.plan and not args.status):
            return

        if args.plan:
            key.plan = args.plan
        if args.status:
            key.status = args.status
        db.commit()
        db.refresh(key)
        print(f"Après : plan={key.plan!r}, status={key.status!r}")
    finally:
        db.close()


if __name__ == "__main__":
    main()