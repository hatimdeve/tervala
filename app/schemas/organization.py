from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID

class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    settings: Dict[str, Any] = Field(default_factory=dict)

class OrganizationCreate(OrganizationBase):
    clerk_org_id: str = Field(..., description="ID de l'organisation dans Clerk")
    quota_limit: int = Field(default=1000, ge=0)

class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    settings: Optional[Dict[str, Any]] = None
    quota_limit: Optional[int] = Field(None, ge=0)

class OrganizationResponse(OrganizationBase):
    id: UUID
    clerk_org_id: str
    quota_limit: int
    quota_used: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True 