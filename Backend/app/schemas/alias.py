from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class CreateAliasRequest(BaseModel):
    destination_email: EmailStr
    label: Optional[str] = Field(default=None, max_length=64)

class AliasResponse(BaseModel):
    id: int
    alias_email: str
    destination_email: str
    label: Optional[str]
    status: str
    confirmation_sent: Optional[bool] = None

    class Config:
        from_attributes = True