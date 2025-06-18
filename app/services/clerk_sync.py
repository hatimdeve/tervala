from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Optional, List
import httpx
import os
from datetime import datetime

from ..models.organization import Organization
from ..models.user import User
from ..schemas.organization import OrganizationCreate
from ..schemas.user import UserCreate

class ClerkSyncService:
    def __init__(self):
        self.clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
        self.clerk_api_base = "https://api.clerk.dev/v1"
        self.webhook_secret = os.getenv("CLERK_WEBHOOK_SECRET")

    async def _get_clerk_client(self) -> httpx.AsyncClient:
        """Crée un client HTTP pour les appels à l'API Clerk"""
        return httpx.AsyncClient(
            base_url=self.clerk_api_base,
            headers={"Authorization": f"Bearer {self.clerk_secret_key}"}
        )

    async def sync_organization(self, db: Session, clerk_org_data: Dict) -> Organization:
        """Synchronise une organisation depuis Clerk"""
        existing_org = db.query(Organization).filter_by(
            clerk_org_id=clerk_org_data["id"]
        ).first()

        org_data = OrganizationCreate(
            clerk_org_id=clerk_org_data["id"],
            name=clerk_org_data["name"],
            settings=clerk_org_data.get("public_metadata", {})
        )

        if existing_org:
            # Mise à jour
            for key, value in org_data.dict(exclude_unset=True).items():
                setattr(existing_org, key, value)
            db.commit()
            return existing_org
        else:
            # Création
            new_org = Organization(**org_data.dict())
            db.add(new_org)
            db.commit()
            db.refresh(new_org)
            return new_org

    async def sync_user(self, db: Session, clerk_user_data: Dict) -> User:
        """Synchronise un utilisateur depuis Clerk"""
        existing_user = db.query(User).filter_by(
            clerk_user_id=clerk_user_data["id"]
        ).first()

        # Récupération de l'email principal
        email = next(
            (email["email_address"] for email in clerk_user_data["email_addresses"] 
             if email["id"] == clerk_user_data["primary_email_address_id"]),
            None
        )

        if not email:
            raise HTTPException(status_code=400, detail="Utilisateur sans email principal")

        user_data = UserCreate(
            clerk_user_id=clerk_user_data["id"],
            email=email,
            organization_id=clerk_user_data.get("organization_id"),
            is_admin=clerk_user_data.get("public_metadata", {}).get("is_admin", False)
        )

        if existing_user:
            # Mise à jour
            for key, value in user_data.dict(exclude_unset=True).items():
                setattr(existing_user, key, value)
            db.commit()
            return existing_user
        else:
            # Création
            new_user = User(**user_data.dict())
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            return new_user

    async def handle_webhook(self, db: Session, event_type: str, data: Dict) -> Dict:
        """Gère les webhooks Clerk"""
        if event_type.startswith("organization"):
            if event_type == "organization.created":
                org = await self.sync_organization(db, data)
                return {"status": "success", "organization_id": str(org.id)}
            elif event_type == "organization.updated":
                org = await self.sync_organization(db, data)
                return {"status": "success", "organization_id": str(org.id)}
            elif event_type == "organization.deleted":
                org = db.query(Organization).filter_by(clerk_org_id=data["id"]).first()
                if org:
                    org.is_active = False
                    db.commit()
                return {"status": "success", "organization_id": str(org.id)}

        elif event_type.startswith("user"):
            if event_type in ["user.created", "user.updated"]:
                user = await self.sync_user(db, data)
                return {"status": "success", "user_id": str(user.id)}
            elif event_type == "user.deleted":
                user = db.query(User).filter_by(clerk_user_id=data["id"]).first()
                if user:
                    user.is_active = False
                    db.commit()
                return {"status": "success", "user_id": str(user.id)}

        return {"status": "ignored", "event_type": event_type}

    async def full_sync(self, db: Session) -> Dict[str, int]:
        """Effectue une synchronisation complète avec Clerk"""
        async with await self._get_clerk_client() as client:
            # Sync organisations
            orgs_synced = 0
            response = await client.get("/organizations")
            orgs_data = response.json()
            for org_data in orgs_data:
                await self.sync_organization(db, org_data)
                orgs_synced += 1

            # Sync utilisateurs
            users_synced = 0
            response = await client.get("/users")
            users_data = response.json()
            for user_data in users_data:
                await self.sync_user(db, user_data)
                users_synced += 1

        return {
            "organizations_synced": orgs_synced,
            "users_synced": users_synced
        }

    async def verify_sync_status(self, db: Session, clerk_id: str, type: str) -> bool:
        """Vérifie si une entité est synchronisée"""
        if type == "organization":
            return db.query(Organization).filter_by(clerk_org_id=clerk_id).first() is not None
        elif type == "user":
            return db.query(User).filter_by(clerk_user_id=clerk_id).first() is not None
        return False 