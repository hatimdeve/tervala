from sqlalchemy import Column, String, DateTime, ForeignKey, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database.config import Base
import uuid

class ProcessingHistory(Base):
    __tablename__ = "processing_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_process_id = Column(UUID(as_uuid=True), ForeignKey('file_processes.id'), nullable=False)
    
    step = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)  # success, error, warning
    details = Column(JSON, default={})
    duration = Column(Float)  # durée en secondes
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    file_process = relationship("FileProcess", backref="history")
    
    def __repr__(self):
        return f"<ProcessingHistory(step='{self.step}', status='{self.status}')>" 