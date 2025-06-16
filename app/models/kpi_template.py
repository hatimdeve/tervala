from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database.config import Base
import uuid

class KPITemplate(Base):
    __tablename__ = "kpi_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    name = Column(String(100), nullable=False)
    description = Column(Text)
    configuration = Column(JSON, nullable=False)
    is_public = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    organization = relationship("Organization", backref="kpi_templates")
    creator = relationship("User", backref="created_kpi_templates")
    
    def __repr__(self):
        return f"<KPITemplate(name='{self.name}', is_public={self.is_public}')>" 