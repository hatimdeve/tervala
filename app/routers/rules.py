from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database.config import get_db
from ..models.user import User
from ..models.processing_rule import ProcessingRule
from ..schemas.rule import RuleCreate, RuleUpdate, RuleResponse
from ..services.rule import RuleService
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/rules", tags=["rules"])
rule_service = RuleService()

@router.post("/", response_model=RuleResponse)
async def create_rule(
    rule_data: RuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle règle de traitement"""
    return await rule_service.create(db, rule_data, current_user)

@router.get("/", response_model=List[RuleResponse])
async def get_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir toutes les règles de l'organisation"""
    return await rule_service.get_all(db, current_user.organization_id)

@router.put("/{rule_id}", response_model=RuleResponse)
async def update_rule(
    rule_id: str,
    rule_data: RuleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour une règle"""
    return await rule_service.update(db, rule_id, rule_data, current_user)

@router.delete("/{rule_id}")
async def delete_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une règle"""
    await rule_service.delete(db, rule_id, current_user)
    return {"message": "Règle supprimée"} 