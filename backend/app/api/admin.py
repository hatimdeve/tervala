from fastapi import APIRouter, Depends
from app.services.clerk import set_user_as_admin
from app.core.auth import get_current_admin_user

router = APIRouter()

@router.post("/users/{user_id}/make-admin")
async def make_user_admin(
    user_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Définit un utilisateur comme administrateur.
    Seul un admin existant peut effectuer cette action.
    """
    await set_user_as_admin(user_id)
    return {"message": "Utilisateur défini comme admin avec succès"} 