from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional

class CreateAliasRequest(BaseModel):
    destination_email: EmailStr
    label: Optional[str] = Field(default=None, max_length=64)

class AliasResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    alias_email: str
    destination_email: str
    label: Optional[str]
    status: str
    confirmation_sent: Optional[bool] = None