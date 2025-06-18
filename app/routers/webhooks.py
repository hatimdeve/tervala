from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict
import os
import uuid
from svix.webhooks import Webhook, WebhookVerificationError

from ..database.config import get_db
from ..services.clerk_sync import ClerkSyncService
from ..models.user import User
from ..models.organization import Organization

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
clerk_sync_service = ClerkSyncService()

CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET", "")

@router.post("/clerk")
async def clerk_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.body()
    headers = request.headers

    print("\n=== Webhook Clerk reçu ===")
    print("Headers:", dict(headers))
    
    wh = Webhook(CLERK_WEBHOOK_SECRET)
    try:
        wh.verify(body, headers)
    except WebhookVerificationError:
        print("❌ Signature invalide")
        raise HTTPException(status_code=401, detail="Invalid Clerk signature")

    event = await request.json()
    event_type = event.get("type")
    data = event.get("data", {})
    
    print(f"Type d'événement : {event_type}")
    print("Données reçues :", data)
    print("========================\n")

    # --- Utilisateur ---
    if event_type in ["user.created", "user.updated"]:
        clerk_user_id = data.get("id")
        email = data.get("email_addresses", [{}])[0].get("email_address")
        org_id = data.get("organization_id")
        user = db.query(User).filter_by(clerk_user_id=clerk_user_id).first()
        if org_id:
            org = db.query(Organization).filter_by(clerk_org_id=org_id).first()
            org_uuid = org.id if org else None
        else:
            org_uuid = None
        if user:
            user.email = email
            user.organization_id = org_uuid
        else:
            user = User(
                id=uuid.uuid4(),
                clerk_user_id=clerk_user_id,
                email=email,
                organization_id=org_uuid
            )
            db.add(user)
        db.commit()
        return {"status": "user synced"}

    if event_type == "user.deleted":
        clerk_user_id = data.get("id")
        user = db.query(User).filter_by(clerk_user_id=clerk_user_id).first()
        if user:
            db.delete(user)
            db.commit()
        return {"status": "user deleted"}

    # --- Organisation ---
    if event_type in ["organization.created", "organization.updated"]:
        clerk_org_id = data.get("id")
        name = data.get("name")
        org = db.query(Organization).filter_by(clerk_org_id=clerk_org_id).first()
        if org:
            org.name = name
        else:
            org = Organization(
                id=uuid.uuid4(),
                clerk_org_id=clerk_org_id,
                name=name
            )
            db.add(org)
        db.commit()
        return {"status": "organization synced"}

    # --- Organization Membership ---
    if event_type in ["organizationMembership.created", "organizationMembership.updated", "organizationMembership.deleted"]:
        print("🔄 Traitement d'un événement de membership")
        user_id = data.get("public_user_data", {}).get("user_id")
        org_id = data.get("organization", {}).get("id")
        role = data.get("role")
        
        print(f"User ID: {user_id}")
        print(f"Org ID: {org_id}")
        print(f"Role: {role}")
        
        if user_id:
            user = db.query(User).filter_by(clerk_user_id=user_id).first()
            
            if user:
                if event_type == "organizationMembership.deleted":
                    print("🗑️ Suppression du membership")
                    user.organization_id = None
                    user.is_admin = False
                    db.commit()
                    print("✅ Utilisateur retiré de l'organisation")
                    return {"status": "membership deleted"}
                elif org_id:
                    org = db.query(Organization).filter_by(clerk_org_id=org_id).first()
                    print(f"Org trouvée: {org is not None}")
                    
                    if org:
                        user.organization_id = org.id
                        is_admin = any(admin_role in role.lower() for admin_role in ['admin', 'owner'])
                        print(f"Rôle détecté comme admin: {is_admin}")
                        user.is_admin = is_admin
                        db.commit()
                        print("✅ Membership synchronisé avec succès")
                        return {"status": "membership synced"}
        
        print("❌ Données manquantes pour la synchronisation")
        return {"status": "membership ignored - missing data"}

    if event_type == "organization.deleted":
        clerk_org_id = data.get("id")
        org = db.query(Organization).filter_by(clerk_org_id=clerk_org_id).first()
        if org:
            db.delete(org)
            db.commit()
        return {"status": "organization deleted"}

    return {"status": "ignored", "event": event_type}

@router.post("/clerk/sync")
async def trigger_sync(
    db: Session = Depends(get_db)
) -> Dict:
    """
    Déclenche une synchronisation manuelle avec Clerk
    """
    try:
        result = await clerk_sync_service.full_sync(db)
        return {
            "status": "success",
            "synchronized": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 