from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

KEY_ID_PATTERN = r"^[0-9a-f]{64}$"

class RegisterKeyRequest(BaseModel):
    key_id: str = Field(pattern=KEY_ID_PATTERN)
    recovery_email: Optional[EmailStr] = None

class VerifyKeyRequest(BaseModel):
    key_id: str = Field(pattern=KEY_ID_PATTERN)

class VerifyKeyResponse(BaseModel):
    exists: bool
    plan: Optional[str] = None
    status: Optional[str] = None

class KeyResponse(BaseModel):
    key_id: str
    plan: str
    status: str
    credits: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True