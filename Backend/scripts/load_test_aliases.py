"""
Test de charge des alias : crée N alias automatiquement et vérifie le quota.
Base de DÉVELOPPEMENT uniquement.
"""
import argparse
import statistics
import time

from fastapi import HTTPException

from app.db.session import SessionLocal  # adapter si ton module de session est ailleurs
from app.models.alias import Alias
from app.models.key import Key
from app.services.alias_service import create_alias

TEST_LABEL = "loadtest"
TEST_DESTINATION = "loadtest@example.com"


def run_creation(key_id, count):
    db = SessionLocal()
    durations = []
    created = 0
    refused_at = None
    try:
        for i in range(1, count + 1):
            start = time.perf_counter()
            try:
                create_alias(db, key_id, TEST_DESTINATION, TEST_LABEL)
            except HTTPException as e:
                if e.status_code == 403:
                    refused_at = i
                    print(f"  -> alias n°{i} refusé : {e.detail}")
                    break
                raise
            durations.append((time.perf_counter() - start) * 1000)
            created += 1
            if i % 10 == 0:
                print(f"  {i} alias créés...")
    finally:
        db.close()

    print("\n=== Résultat ===")
    print(f"Alias créés : {created}")
    print("Premier refus :", "aucun (illimité)" if refused_at is None else f"alias n°{refused_at}")
    if durations:
        ordered = sorted(durations)
        p95 = ordered[int(len(ordered) * 0.95) - 1] if len(ordered) >= 20 else ordered[-1]
        print(f"Durée par création : moyenne {statistics.mean(durations):.1f} ms, p95 {p95:.1f} ms, max {max(durations):.1f} ms")


def cleanup(key_id):
    db = SessionLocal()
    try:
        key = db.query(Key).filter(Key.key_id == key_id).first()
        if not key:
            print("Clé introuvable.")
            return
        deleted = (
            db.query(Alias)
            .filter(Alias.key_id == key.id, Alias.label == TEST_LABEL)
            .delete(synchronize_session=False)
        )
        db.commit()
        print(f"{deleted} alias de test supprimés.")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--key-id", required=True)
    parser.add_argument("--count", type=int, default=101)
    parser.add_argument("--cleanup", action="store_true")
    parser.add_argument("--yes", action="store_true")
    args = parser.parse_args()

    if args.cleanup:
        cleanup(args.key_id)
        return

    if not args.yes:
        answer = input(f"Créer jusqu'à {args.count} alias de test sur cette base ? [o/N] ")
        if answer.strip().lower() not in ("o", "oui", "y", "yes"):
            print("Annulé.")
            return

    run_creation(args.key_id, args.count)


if __name__ == "__main__":
    main()
