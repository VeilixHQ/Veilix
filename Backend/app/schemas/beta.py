from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field

FEATURES = Literal["creation", "transfert", "reponse", "desactivation", "suppression", "tags", "tableau_de_bord"]


class SignupRequest(BaseModel):
    email: EmailStr
    consent: bool
    invitation: Optional[str] = Field(default=None, max_length=128)
    website: Optional[str] = Field(default=None, max_length=200)


class PhaseStatus(BaseModel):
    open: bool
    opens_at: Optional[datetime] = None
    signups_close_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    wave: Optional[int] = None
    wave2_opens_at: Optional[datetime] = None


class BetaPublicStatus(BaseModel):
    private: PhaseStatus
    public: PhaseStatus
    launch_at: Optional[datetime] = None


class FeedbackRequest(BaseModel):
    features_tried: list[FEATURES] = Field(default_factory=list, max_length=7)
    alias_lifecycle: Literal["oui", "partiel", "non"]
    forwarding_ok: Literal["oui", "partiel", "non", "pas_teste"]
    problem: str = Field(default="", max_length=2000)
    unclear: str = Field(default="", max_length=2000)
    recommend: int = Field(ge=0, le=10)
    recommend_why: str = Field(default="", max_length=1000)


class BetaKeyStatus(BaseModel):
    phase: Optional[str] = None
    ends_at: Optional[datetime] = None
    feedback_due_at: Optional[datetime] = None
    overdue: bool = False
    reminded: bool = False
    final_window: bool = False
    final_sent: bool = False
    suspended_for_feedback: bool = False
    feedback_count: int = 0
