from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from uuid import UUID

from ..database.config import get_db
from ..models.user import User
from ..schemas.organization import OrganizationCreate, OrganizationUpdate, OrganizationResponse
from ..services.organization import OrganizationService
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/organizations", tags=["organizations"])
org_service = OrganizationService()

@router.post("/", response_model=OrganizationResponse)
async def create_organization(
    org_data: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée une nouvelle organisation"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Permission refusée")
    return await org_service.create(db, org_data)

@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère les détails d'une organisation"""
    if current_user.organization_id != org_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    org = await org_service.get(db, org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organisation non trouvée")
    return org

@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: UUID,
    org_data: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Met à jour une organisation"""
    if current_user.organization_id != org_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    org = await org_service.update(db, org_id, org_data)
    if not org:
        raise HTTPException(status_code=404, detail="Organisation non trouvée")
    return org

@router.get("/{org_id}/usage", response_model=Dict)
async def get_organization_usage(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtient les statistiques d'utilisation d'une organisation"""
    if current_user.organization_id != org_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    return await org_service.get_usage_stats(db, org_id)

@router.get("/{org_id}/quota", response_model=Dict)
async def check_quota(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vérifie le quota d'une organisation"""
    if current_user.organization_id != org_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    return await org_service.check_quota(db, org_id)

@router.post("/{org_id}/quota/increment", response_model=Dict)
async def increment_quota(
    org_id: UUID,
    amount: int = 1,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Incrémente le quota utilisé"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    return await org_service.increment_quota(db, org_id, amount)

@router.post("/{org_id}/quota/reset", response_model=Dict)
async def reset_quota(
    org_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Réinitialise le quota"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    return await org_service.reset_quota(db, org_id)

@router.get("/{org_id}/activity", response_model=List[Dict])
async def get_activity_summary(
    org_id: UUID,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtient le résumé d'activité d'une organisation"""
    if current_user.organization_id != org_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    return await org_service.get_activity_summary(db, org_id, days)

@router.get("/", response_model=List[OrganizationResponse])
async def list_organizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère la liste de toutes les organisations"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Permission refusée")
    return await org_service.list_all(db) 