from fastapi import HTTPException, Header, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.key_service import require_active_key

KEY_ID_HEADER = "X-Veilix-Key-Id"
KEY_ID_LENGTH = 64

def get_current_key_id(
    x_veilix_key_id: str = Header(..., alias=KEY_ID_HEADER),
    db: Session = Depends(get_db),
) -> int:
    if len(x_veilix_key_id) != KEY_ID_LENGTH or not all(c in "0123456789abcdef" for c in x_veilix_key_id):
        raise HTTPException(status_code=401, detail="Format de clé invalide")
    key = require_active_key(db, x_veilix_key_id)
    return key.id

def get_current_key_id_str(
    x_veilix_key_id: str = Header(..., alias=KEY_ID_HEADER),
) -> str:
    return x_veilix_key_id