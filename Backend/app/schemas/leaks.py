from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class LeakCheckRequest(BaseModel):
    email: EmailStr
    website: Optional[str] = Field(default=None, max_length=200)


class Breach(BaseModel):
    name: str
    title: str
    domain: str
    date: str
    count: int
    data: list[str]
    verified: bool


class LeakCheckResult(BaseModel):
    found: bool
    breaches: list[Breach]
