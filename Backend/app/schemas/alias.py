from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional
from datetime import datetime

class CreateAliasRequest(BaseModel):
    destination_email: EmailStr
    label: Optional[str] = Field(default=None, max_length=64)
    domain_id: Optional[int] = None
    local_part: Optional[str] = Field(default=None, max_length=64)

class AliasResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    alias_email: str
    destination_email: str
    label: Optional[str]
    status: str
    domain_id: Optional[int] = None
    forwarded_count: int = 0
    blocked_count: int = 0
    leak_detected_at: Optional[datetime] = None
    confirmation_sent: Optional[bool] = None

class BlockSenderRequest(BaseModel):
    sender: str = Field(min_length=3, max_length=320)

class BlockedSenderResponse(BaseModel):
    id: int
    sender: str
    blocked_count: int
    created_at: datetime