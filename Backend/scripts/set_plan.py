"""
Change le plan (et éventuellement le statut) d'une clé dans la base de DÉVELOPPEMENT,
sans passer par le paiement. Pratique pour tester le plan Pro.

Depuis le dossier Backend :

    python -m scripts.set_plan --key-id <CLE> --show
    python -m scripts.set_plan --key-id <CLE> --plan pro
    python -m scripts.set_plan --key-id <CLE> --plan pro --status active
    python -m scripts.set_plan --key-id <CLE> --plan launch --status active
"""
import argparse

from app.db.session import SessionLocal  # ← adapter si besoin
from app.models.key import Key


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--key-id", required=True)
    parser.add_argument("--plan", choices=["pro", "launch"])
    parser.add_argument("--status", help="Ex. active (valeur utilisée par ton paywall)")
    parser.add_argument("--show", action="store_true", help="Afficher plan et statut sans rien modifier")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        key = db.query(Key).filter(Key.key_id == args.key_id).first()
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