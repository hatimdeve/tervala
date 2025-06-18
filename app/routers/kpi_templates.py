from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database.config import get_db
from ..models.user import User
from ..models.kpi_template import KPITemplate
from ..schemas.kpi import KPITemplateCreate, KPITemplateUpdate, KPITemplateResponse
from ..services.kpi import KPIService
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/kpi-templates", tags=["kpi-templates"])
kpi_service = KPIService()

@router.post("/", response_model=KPITemplateResponse)
async def create_template(
    template_data: KPITemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer un nouveau template de KPI"""
    return await kpi_service.create_template(db, template_data, current_user)

@router.get("/", response_model=List[KPITemplateResponse])
async def get_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir tous les templates de KPI (publics + organisation)"""
    return await kpi_service.get_templates(db, current_user.organization_id)

@router.put("/{template_id}", response_model=KPITemplateResponse)
async def update_template(
    template_id: str,
    template_data: KPITemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour un template de KPI"""
    return await kpi_service.update_template(db, template_id, template_data, current_user)

@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer un template de KPI"""
    await kpi_service.delete_template(db, template_id, current_user)
    return {"message": "Template supprimé"} 