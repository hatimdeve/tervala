from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID

class RuleBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    rule_type: str = Field(..., description="clean, analyze")
    configuration: Dict[str, Any] = Field(..., description="Configuration spécifique de la règle")
    is_active: bool = True

class RuleCreate(RuleBase):
    organization_id: UUID

class RuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class RuleResponse(RuleBase):
    id: UUID
    organization_id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True 