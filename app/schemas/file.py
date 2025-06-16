from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID

class FileProcessBase(BaseModel):
    original_filename: str
    file_path: str
    file_size: Optional[int] = None

class FileProcessCreate(FileProcessBase):
    organization_id: UUID
    user_id: UUID

class FileProcessUpdate(BaseModel):
    original_filename: Optional[str] = None
    status: Optional[str] = None
    error_message: Optional[str] = None
    file_metadata: Optional[Dict[str, Any]] = None
    processing_options: Optional[Dict[str, Any]] = None
    # Ajoute d'autres champs optionnels si besoin

class ProcessingResponse(BaseModel):
    file_id: UUID
    status: str
    message: str
    details: Optional[Dict[str, Any]] = None

class FileProcessResponse(FileProcessBase):
    id: UUID
    organization_id: UUID
    user_id: UUID
    status: str = Field(..., description="pending, processing, completed, error")
    processing_details: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

class ProcessingHistoryResponse(BaseModel):
    id: UUID
    file_process_id: UUID
    step: str
    status: str
    details: Dict[str, Any]
    duration: float
    created_at: datetime

    class Config:
        orm_mode = True 