from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID

class KPITemplateBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    configuration: Dict[str, Any] = Field(..., description="Configuration du template KPI")
    is_public: bool = False

class KPITemplateCreate(KPITemplateBase):
    organization_id: UUID

class KPITemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None

class KPITemplateResponse(KPITemplateBase):
    id: UUID
    organization_id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

class KPIResult(BaseModel):
    name: str
    value: Any
    unit: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict) 