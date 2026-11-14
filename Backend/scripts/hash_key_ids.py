from app.core.keys import is_stored_form, stored_key_id
from app.db.session import SessionLocal
from app.models.key import Key


def main() -> None:
    db = SessionLocal()
    try:
        converted = 0
        for key in db.query(Key).all():
            if is_stored_form(key.key_id):
                continue
            key.key_id = stored_key_id(key.key_id)
            converted += 1
        db.commit()
        print(f"Clés converties : {converted}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
