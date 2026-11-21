from fastapi import HTTPException, Header, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.key import Key
from app.services.key_service import require_active_key

KEY_ID_HEADER = "X-Veilix-Key-Id"
KEY_ID_LENGTH = 64
BEARER = "bearer "

def _bearer(authorization: str | None) -> str | None:
    if authorization and authorization[:len(BEARER)].lower() == BEARER:
        return authorization[len(BEARER):].strip()
    return None

def get_current_key(
    x_veilix_key_id: str | None = Header(None, alias=KEY_ID_HEADER),
    authorization: str | None = Header(None),
    db: Session = Depends(get_db),
) -> Key:
    if x_veilix_key_id is not None:
        if len(x_veilix_key_id) != KEY_ID_LENGTH or not all(c in "0123456789abcdef" for c in x_veilix_key_id):
            raise HTTPException(status_code=401, detail="Unauthorized")
        return require_active_key(db, x_veilix_key_id)
    token = _bearer(authorization)
    if token:
        from app.services.api_token_service import key_for_token

        return key_for_token(db, token)
    raise HTTPException(status_code=422, detail="Identifiants manquants")

def get_current_key_id(key: Key = Depends(get_current_key)) -> int:
    return key.id

def get_current_key_id_str(
    x_veilix_key_id: str | None = Header(None, alias=KEY_ID_HEADER),
    authorization: str | None = Header(None),
) -> str:
    if x_veilix_key_id is not None:
        return x_veilix_key_id
    token = _bearer(authorization)
    if token:
        from app.services.api_token_service import rate_identity

        return rate_identity(token)
    raise HTTPException(status_code=422, detail="Identifiants manquants")

def require_key_header(x_veilix_key_id: str | None = Header(None, alias=KEY_ID_HEADER)) -> None:
    if x_veilix_key_id is None:
        raise HTTPException(status_code=403, detail="KEY_REQUIRED")
