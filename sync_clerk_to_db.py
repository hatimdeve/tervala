import os
import requests
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from app.models.user import User
from app.models.organization import Organization

# Mets ici ta clé API Clerk (ou utilise une variable d'environnement)
CLERK_API_KEY = os.environ.get("CLERK_API_KEY") or "pk_test_dml0YWwtZm94aG91bmQtMjguY2xlcmsuYWNjb3VudHMuZGV2JA"

# Mets ici l'URL de ta base (ou utilise une variable d'environnement)
DATABASE_URL = os.environ.get("DATABASE_URL") or "postgresql://nizar1188@localhost:5432/tervela"

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# 1. Synchronisation des organisations
orgs_resp = requests.get(
    "https://api.clerk.dev/v1/organizations",
    headers={"Authorization": f"Bearer {CLERK_API_KEY}"}
)
clerk_orgs = orgs_resp.json()
print(clerk_orgs)

for co in clerk_orgs['data']:
    org = session.query(Organization).filter_by(clerk_org_id=co["id"]).first()
    if not org:
        org = Organization(
            clerk_org_id=co["id"],
            name=co["name"],
            # Ajoute d'autres champs si besoin
        )
        session.add(org)
        print(f"Organisation ajoutée : {co['name']}")

session.commit()

# 2. Synchronisation des utilisateurs
users_resp = requests.get(
    "https://api.clerk.dev/v1/users",
    headers={"Authorization": f"Bearer {CLERK_API_KEY}"}
)
clerk_users = users_resp.json()

# Récupération des memberships
memberships_resp = requests.get(
    "https://api.clerk.dev/v1/organization_memberships",
    headers={"Authorization": f"Bearer {CLERK_API_KEY}"}
)
memberships = memberships_resp.json()
print("Memberships Clerk :", memberships)

# Mapping user_id -> (org_id, role)
user_memberships = {}
for m in memberships.get('data', []):
    user_id = m['public_user_data']['user_id']
    org_id = m['organization']['id']
    role = m['role']
    # On considère comme admin tous les rôles qui contiennent "admin" ou "owner"
    is_admin = any(admin_role in role.lower() for admin_role in ['admin', 'owner'])
    user_memberships[user_id] = {'org_id': org_id, 'role': role, 'is_admin': is_admin}

for cu in clerk_users:
    email = cu["email_addresses"][0]["email_address"]
    print(f"\nTraitement de l'utilisateur : {email}")
    user = session.query(User).filter_by(clerk_user_id=cu["id"]).first()
    
    # Recherche l'organisation et le rôle admin via le mapping
    org_id = None
    is_admin = False
    membership = user_memberships.get(cu["id"])
    
    if membership:
        org = session.query(Organization).filter_by(clerk_org_id=membership['org_id']).first()
        if org:
            org_id = org.id
        is_admin = membership['is_admin']
        print(f"Membership trouvé : org_id={org_id}, role={membership['role']}, is_admin={is_admin}")
    else:
        print("Aucun membership trouvé pour cet utilisateur.")
    if not user:
        user = User(
            clerk_user_id=cu["id"],
            email=email,
            organization_id=org_id,
            is_admin=is_admin
        )
        session.add(user)
        print(f"Utilisateur ajouté : {email}")
    else:
        print(f"Utilisateur existant : {email}")
        print(f"Ancien org_id : {user.organization_id}, Nouveau org_id : {org_id}")
        print(f"Ancien is_admin : {user.is_admin}, Nouveau is_admin : {is_admin}")
        updated = False
        if user.organization_id != org_id:
            user.organization_id = org_id
            updated = True
        if user.is_admin != is_admin:
            user.is_admin = is_admin
            updated = True
        if user.email != email:
            user.email = email
            updated = True
        if updated:
            print(f"Utilisateur mis à jour : {email}")

session.commit()
session.close()
print("Synchronisation terminée.") 