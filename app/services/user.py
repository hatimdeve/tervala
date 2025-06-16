from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from uuid import UUID

from ..models.user import User
from ..models.file_process import FileProcess
from ..schemas.user import UserCreate, UserUpdate

class UserService:
    async def create(self, db: Session, user_data: UserCreate) -> User:
        """Crée un nouvel utilisateur"""
        user = User(**user_data.dict())
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    async def get(self, db: Session, user_id: UUID) -> Optional[User]:
        """Récupère un utilisateur par son ID"""
        return db.query(User).filter_by(id=user_id).first()

    async def get_by_clerk_id(self, db: Session, clerk_id: str) -> Optional[User]:
        """Récupère un utilisateur par son ID Clerk"""
        return db.query(User).filter_by(clerk_user_id=clerk_id).first()

    async def update(self, db: Session, user_id: UUID, user_data: UserUpdate) -> Optional[User]:
        """Met à jour un utilisateur"""
        user = await self.get(db, user_id)
        if not user:
            return None

        for key, value in user_data.dict(exclude_unset=True).items():
            setattr(user, key, value)
        
        db.commit()
        db.refresh(user)
        return user

    async def update_role(self, db: Session, user_id: UUID, is_admin: bool) -> User:
        """Met à jour le rôle d'un utilisateur"""
        user = await self.get(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        user.is_admin = is_admin
        db.commit()
        db.refresh(user)
        return user

    async def get_activity(self, db: Session, user_id: UUID) -> Dict:
        """Récupère l'activité d'un utilisateur"""
        # Statistiques générales
        total_files = db.query(func.count(FileProcess.id))\
            .filter_by(user_id=user_id)\
            .scalar()

        successful_files = db.query(func.count(FileProcess.id))\
            .filter_by(user_id=user_id, status="completed")\
            .scalar()

        failed_files = db.query(func.count(FileProcess.id))\
            .filter_by(user_id=user_id, status="error")\
            .scalar()

        # Activité récente (30 derniers jours)
        start_date = datetime.utcnow() - timedelta(days=30)
        recent_activity = db.query(
            func.date(FileProcess.created_at).label('date'),
            func.count(FileProcess.id).label('count')
        ).filter(
            FileProcess.user_id == user_id,
            FileProcess.created_at >= start_date
        ).group_by(
            func.date(FileProcess.created_at)
        ).all()

        return {
            "total_files_processed": total_files,
            "successful_files": successful_files,
            "failed_files": failed_files,
            "success_rate": round(
                (successful_files / total_files * 100) if total_files > 0 else 0,
                2
            ),
            "recent_activity": [
                {
                    "date": activity.date.isoformat(),
                    "files_processed": activity.count
                }
                for activity in recent_activity
            ]
        }

    async def get_organization_users(
        self, 
        db: Session, 
        organization_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """Récupère tous les utilisateurs d'une organisation"""
        return db.query(User)\
            .filter_by(organization_id=organization_id)\
            .offset(skip)\
            .limit(limit)\
            .all()

    async def search_users(
        self,
        db: Session,
        organization_id: UUID,
        search_term: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """Recherche des utilisateurs dans une organisation"""
        return db.query(User)\
            .filter(
                User.organization_id == organization_id,
                User.email.ilike(f"%{search_term}%")
            )\
            .offset(skip)\
            .limit(limit)\
            .all()

    async def get_user_preferences(self, db: Session, user_id: UUID) -> Dict:
        """Récupère les préférences d'un utilisateur"""
        user = await self.get(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        # Pour l'instant, on retourne les préférences de base
        # À étendre selon les besoins
        return {
            "language": "fr",
            "notifications_enabled": True,
            "theme": "light"
        }

    async def update_user_preferences(
        self,
        db: Session,
        user_id: UUID,
        preferences: Dict
    ) -> Dict:
        """Met à jour les préférences d'un utilisateur"""
        user = await self.get(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

        # À implémenter : stockage des préférences
        # Pour l'instant, on simule juste le retour
        return preferences

    async def list_all(self, db: Session) -> List[User]:
        """Récupère tous les utilisateurs"""
        return db.query(User).all() 