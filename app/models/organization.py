from sqlalchemy import Column, String, JSON, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from ..database.config import Base
import uuid

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_org_id = Column(String, unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    settings = Column(JSON, default={})
    quota_limit = Column(Integer, default=1000)  # Limite de traitement par défaut
    quota_used = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Organization(name='{self.name}', clerk_org_id='{self.clerk_org_id}')>" 