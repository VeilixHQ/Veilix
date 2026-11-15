import argparse

from app.db.session import SessionLocal
from app.models.access_code import AccessCode
from app.services.access_service import generate_codes, revoke_code


def _generate(db, args) -> None:
    codes = generate_codes(db, args.phase, args.count, args.days)
    print(f"{len(codes)} code(s) {args.phase} valables {args.days} jours. Ils ne seront plus jamais affichés :")
    for code in codes:
        print(code)


def _list(db, args) -> None:
    query = db.query(AccessCode).order_by(AccessCode.id)
    if args.phase:
        query = query.filter(AccessCode.phase == args.phase)
    print(f"{'id':>4}  {'phase':<8} {'statut':<8} {'créé le':<16} {'utilisé le':<16} {'expire le':<16} clé")
    for access in query.all():
        used = access.used_at.strftime("%Y-%m-%d %H:%M") if access.used_at else "-"
        print(
            f"{access.id:>4}  {access.phase:<8} {access.status:<8} "
            f"{access.created_at:%Y-%m-%d %H:%M} {used:<16} {access.expires_at:%Y-%m-%d %H:%M} "
            f"{access.key_id if access.key_id is not None else '-'}"
        )


def _revoke(db, args) -> None:
    access = revoke_code(db, code=args.code, code_id=args.id)
    if not access:
        print("Code introuvable.")
        return
    suffix = f" ; clé {access.key_id} suspendue" if access.key_id is not None else ""
    print(f"Code {access.id} révoqué{suffix}.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Gestion des codes d'accès bêta")
    commands = parser.add_subparsers(dest="command", required=True)

    generate = commands.add_parser("generate", help="Créer des codes individuels")
    generate.add_argument("--phase", choices=["private", "public"], required=True)
    generate.add_argument("--count", type=int, required=True)
    generate.add_argument("--days", type=int, default=60, help="Durée de validité avant activation")

    listing = commands.add_parser("list", help="Suivre les codes sans les afficher")
    listing.add_argument("--phase", choices=["private", "public"])

    revoke = commands.add_parser("revoke", help="Révoquer un code et suspendre la clé associée")
    target = revoke.add_mutually_exclusive_group(required=True)
    target.add_argument("--code")
    target.add_argument("--id", type=int)

    args = parser.parse_args()
    db = SessionLocal()
    try:
        {"generate": _generate, "list": _list, "revoke": _revoke}[args.command](db, args)
    finally:
        db.close()


if __name__ == "__main__":
    main()
