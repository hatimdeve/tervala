from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database.config import Base
import uuid

class ProcessingRule(Base):
    __tablename__ = "processing_rules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    name = Column(String(100), nullable=False)
    description = Column(Text)
    rule_type = Column(String(50), nullable=False)  # clean, analyze
    configuration = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    organization = relationship("Organization", backref="processing_rules")
    creator = relationship("User", backref="created_rules")
    
    def __repr__(self):
        return f"<ProcessingRule(name='{self.name}', type='{self.rule_type}')>" 