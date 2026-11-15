import argparse

from app.db.session import SessionLocal
from app.plans import STORED_PLANS
from app.services.key_service import get_key_by_id


def _describe(key) -> str:
    return f"plan={key.plan!r}, status={key.status!r}, credits={key.credits}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--key-id", required=True)
    parser.add_argument("--plan", choices=STORED_PLANS)
    parser.add_argument("--status", choices=["active", "suspended", "pending_payment"])
    parser.add_argument("--add-credits", type=int, help="Nombre de crédits à ajouter (négatif pour en retirer)")
    parser.add_argument("--show", action="store_true", help="Afficher plan, statut et crédits sans rien modifier")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        key = get_key_by_id(db, args.key_id)
        if not key:
            print("Clé introuvable.")
            return

        print(f"Avant : {_describe(key)}")
        if args.show or (not args.plan and not args.status and not args.add_credits):
            return

        if args.add_credits and key.credits + args.add_credits < 0:
            print("Refusé : le solde de crédits deviendrait négatif.")
            return

        if args.plan:
            key.plan = args.plan
        if args.status:
            key.status = args.status
        if args.add_credits:
            key.credits += args.add_credits
        db.commit()
        db.refresh(key)
        print(f"Après : {_describe(key)}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
