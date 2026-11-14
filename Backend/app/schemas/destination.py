from pydantic import BaseModel, Field

class ConfirmDestinationRequest(BaseModel):
    token: str = Field(min_length=20, max_length=200)

class ConfirmDestinationResponse(BaseModel):
    status: str
    activated_aliases: int
