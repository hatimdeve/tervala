from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict
from uuid import UUID

from ..database.config import get_db
from ..models.user import User
from ..schemas.user import UserCreate, UserUpdate, UserResponse
from ..services.user import UserService
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])
user_service = UserService()

@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée un nouvel utilisateur"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Permission refusée")
    return await user_service.create(db, user_data)

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtient le profil de l'utilisateur connecté"""
    return current_user

@router.get("/me/activity", response_model=Dict)
async def get_current_user_activity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtient l'activité de l'utilisateur connecté"""
    return await user_service.get_activity(db, current_user.id)

@router.get("/me/preferences", response_model=Dict)
async def get_current_user_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtient les préférences de l'utilisateur connecté"""
    return await user_service.get_user_preferences(db, current_user.id)

@router.put("/me/preferences", response_model=Dict)
async def update_current_user_preferences(
    preferences: Dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Met à jour les préférences de l'utilisateur connecté"""
    return await user_service.update_user_preferences(db, current_user.id, preferences)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtient les détails d'un utilisateur"""
    # Vérification des permissions
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    user = await user_service.get(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.put("/{user_id}/role")
async def update_user_role(
    user_id: UUID,
    is_admin: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Modifie le rôle d'un utilisateur"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Permission refusée")
    return await user_service.update_role(db, user_id, is_admin)

@router.get("/organization/{org_id}", response_model=List[UserResponse])
async def get_organization_users(
    org_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste les utilisateurs d'une organisation"""
    if current_user.organization_id != org_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    return await user_service.get_organization_users(db, org_id, skip, limit)

@router.get("/organization/{org_id}/search", response_model=List[UserResponse])
async def search_organization_users(
    org_id: UUID,
    search: str = Query(..., min_length=2),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recherche des utilisateurs dans une organisation"""
    if current_user.organization_id != org_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Permission refusée")
    
    return await user_service.search_users(db, org_id, search, skip, limit)

@router.get("/", response_model=List[UserResponse])
async def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Liste tous les utilisateurs"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Permission refusée")
    return await user_service.list_all(db) 