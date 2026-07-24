from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class RegisterKeyRequest(BaseModel):
    key_id: str
    recovery_email: Optional[EmailStr] = None

class VerifyKeyRequest(BaseModel):
    key_id: str

class VerifyKeyResponse(BaseModel):
    exists: bool
    plan: Optional[str] = None
    status: Optional[str] = None

class KeyResponse(BaseModel):
    key_id: str
    plan: str
    status: str
    credits: int
    created_at: datetime
    class Config:
        from_attributes = True