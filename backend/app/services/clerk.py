from clerk import Clerk
from fastapi import HTTPException

clerk_client = Clerk(secret_key=settings.CLERK_SECRET_KEY)

async def set_user_as_admin(user_id: str) -> None:
    try:
        await clerk_client.users.update(
            user_id,
            public_metadata={
                "role": "admin"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Erreur lors de la définition du rôle admin : {str(e)}"
        ) 