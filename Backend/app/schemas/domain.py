from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class AddDomainRequest(BaseModel):
    domain: str = Field(min_length=3, max_length=253)


class CatchAllRequest(BaseModel):
    enabled: bool
    destination_email: Optional[EmailStr] = None


class DnsRecord(BaseModel):
    type: str
    name: str
    value: str
    priority: Optional[int] = None
    purpose: str


class DomainResponse(BaseModel):
    id: int
    domain: str
    verified: bool
    verified_at: Optional[datetime] = None
    last_checked_at: Optional[datetime] = None
    catch_all: bool
    catch_all_destination: Optional[str] = None
    aliases: int
    records: list[DnsRecord]


class DomainCheckResponse(DomainResponse):
    ownership: bool
    receiving: bool
    lookup_failed: bool
