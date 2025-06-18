from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from uuid import UUID

from ..models.organization import Organization
from ..models.user import User
from ..models.file_process import FileProcess
from ..schemas.organization import OrganizationCreate, OrganizationUpdate

class OrganizationService:
    async def create(self, db: Session, org_data: OrganizationCreate) -> Organization:
        """Crée une nouvelle organisation"""
        org = Organization(**org_data.dict())
        db.add(org)
        db.commit()
        db.refresh(org)
        return org

    async def get(self, db: Session, org_id: UUID) -> Optional[Organization]:
        """Récupère une organisation par son ID"""
        return db.query(Organization).filter_by(id=org_id).first()

    async def update(self, db: Session, org_id: UUID, org_data: OrganizationUpdate) -> Optional[Organization]:
        """Met à jour une organisation"""
        org = await self.get(db, org_id)
        if not org:
            return None

        for key, value in org_data.dict(exclude_unset=True).items():
            setattr(org, key, value)
        
        db.commit()
        db.refresh(org)
        return org

    async def get_usage_stats(self, db: Session, org_id: UUID) -> Dict:
        """Récupère les statistiques d'utilisation d'une organisation"""
        # Nombre total de fichiers traités
        total_files = db.query(func.count(FileProcess.id))\
            .filter_by(organization_id=org_id)\
            .scalar()

        # Nombre de fichiers traités aujourd'hui
        today = datetime.utcnow().date()
        files_today = db.query(func.count(FileProcess.id))\
            .filter_by(organization_id=org_id)\
            .filter(func.date(FileProcess.created_at) == today)\
            .scalar()

        # Nombre d'utilisateurs actifs
        active_users = db.query(func.count(User.id))\
            .filter_by(organization_id=org_id, is_active=True)\
            .scalar()

        # Taux de succès des traitements
        success_rate = db.query(
            func.count(FileProcess.id).filter(FileProcess.status == "completed") * 100.0 /
            func.count(FileProcess.id)
        ).filter_by(organization_id=org_id).scalar() or 0.0

        return {
            "total_files_processed": total_files,
            "files_processed_today": files_today,
            "active_users": active_users,
            "processing_success_rate": round(success_rate, 2),
        }

    async def check_quota(self, db: Session, org_id: UUID) -> Dict:
        """Vérifie le quota d'une organisation"""
        org = await self.get(db, org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organisation non trouvée")

        return {
            "quota_used": org.quota_used,
            "quota_limit": org.quota_limit,
            "quota_remaining": org.quota_limit - org.quota_used,
            "quota_percentage": (org.quota_used / org.quota_limit) * 100 if org.quota_limit > 0 else 0
        }

    async def increment_quota(self, db: Session, org_id: UUID, amount: int = 1) -> Dict:
        """Incrémente le quota utilisé"""
        org = await self.get(db, org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organisation non trouvée")

        if org.quota_used + amount > org.quota_limit:
            raise HTTPException(status_code=403, detail="Quota dépassé")

        org.quota_used += amount
        db.commit()

        return await self.check_quota(db, org_id)

    async def reset_quota(self, db: Session, org_id: UUID) -> Dict:
        """Réinitialise le quota utilisé"""
        org = await self.get(db, org_id)
        if not org:
            raise HTTPException(status_code=404, detail="Organisation non trouvée")

        org.quota_used = 0
        db.commit()

        return await self.check_quota(db, org_id)

    async def get_activity_summary(self, db: Session, org_id: UUID, days: int = 30) -> List[Dict]:
        """Récupère un résumé de l'activité sur une période"""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Activité quotidienne
        daily_activity = db.query(
            func.date(FileProcess.created_at).label('date'),
            func.count(FileProcess.id).label('total_files'),
            func.count(FileProcess.id).filter(FileProcess.status == "completed").label('successful_files'),
            func.count(FileProcess.id).filter(FileProcess.status == "error").label('failed_files')
        ).filter(
            FileProcess.organization_id == org_id,
            FileProcess.created_at >= start_date
        ).group_by(
            func.date(FileProcess.created_at)
        ).all()

        return [
            {
                "date": activity.date.isoformat(),
                "total_files": activity.total_files,
                "successful_files": activity.successful_files,
                "failed_files": activity.failed_files,
                "success_rate": round(
                    (activity.successful_files / activity.total_files * 100)
                    if activity.total_files > 0 else 0,
                    2
                )
            }
            for activity in daily_activity
        ]

    async def list_all(self, db: Session) -> List[Organization]:
        """Récupère toutes les organisations"""
        return db.query(Organization).all() 