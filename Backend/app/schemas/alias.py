from pydantic import BaseModel, EmailStr
from typing import Optional

class CreateAliasRequest(BaseModel):
    destination_email: EmailStr
    label: Optional[str] = None

class AliasResponse(BaseModel):
    id: int
    alias_email: str
    destination_email: str
    label: Optional[str]
    status: str

    class Config:
        from_attributes = True