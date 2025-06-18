from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    clerk_user_id: str = Field(..., description="ID de l'utilisateur dans Clerk")
    organization_id: Optional[UUID] = None

class UserCreate(UserBase):
    is_admin: bool = Field(default=False)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    is_admin: Optional[bool] = None

class UserResponse(UserBase):
    id: UUID
    is_admin: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True 