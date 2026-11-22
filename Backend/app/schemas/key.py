from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional
from datetime import datetime

KEY_ID_PATTERN = r"^[0-9a-f]{64}$"

class RegisterKeyRequest(BaseModel):
    key_id: str = Field(pattern=KEY_ID_PATTERN)
    access_code: str = Field(min_length=1, max_length=40)
    contact_email: Optional[EmailStr] = None
    accept_terms: bool

class CheckCodeRequest(BaseModel):
    access_code: str = Field(min_length=1, max_length=40)

class CheckCodeResponse(BaseModel):
    valid: bool
    phase: Optional[str] = None
    needs_contact: bool = False

class VerifyKeyRequest(BaseModel):
    key_id: str = Field(pattern=KEY_ID_PATTERN)

class VerifyKeyResponse(BaseModel):
    exists: bool
    plan: Optional[str] = None
    status: Optional[str] = None

class Badge(BaseModel):
    id: str
    number: Optional[int] = None

class KeyAccountResponse(BaseModel):
    plan: str
    status: str
    credits: int
    aliases_used: int
    alias_quota: Optional[int] = None
    destinations_used: int = 0
    destination_limit: Optional[int] = None
    created_at: Optional[datetime] = None
    badges: list[Badge] = []
    custom_domains_available: bool = False

class KeyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key_id: str
    plan: str
    status: str
    credits: int
    created_at: Optional[datetime] = None
