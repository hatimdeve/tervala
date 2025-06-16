from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database.config import Base
import uuid

class FileProcess(Base):
    __tablename__ = "file_processes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer)  # en bytes
    
    status = Column(String(50), default='pending')  # pending, processing, completed, error
    process_type = Column(String(50), nullable=False)  # clean, analyze
    error_message = Column(Text)
    
    file_metadata = Column(JSON, default={})
    processing_options = Column(JSON, default={})
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # Relations
    organization = relationship("Organization", backref="file_processes")
    user = relationship("User", backref="file_processes")
    
    def __repr__(self):
        return f"<FileProcess(filename='{self.original_filename}', status='{self.status}')>" 