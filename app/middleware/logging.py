from fastapi import Request
import jwt
import logging
from typing import Optional
import json

# Configuration du logger
logging.basicConfig(
    level=logging.DEBUG,  # Changé en DEBUG pour voir plus de détails
    format='%(levelname)s:%(message)s'
)
logger = logging.getLogger(__name__)

def get_user_email_from_token(token: str) -> Optional[str]:
    """Extrait l'email de l'utilisateur du token JWT."""
    try:
        # Supprimer le préfixe 'Bearer ' si présent
        if token.startswith('Bearer '):
            token = token.split(' ')[1]
            
        logger.debug(f"Token reçu: {token[:50]}...")
        
        # Décoder le token sans vérifier la signature
        payload = jwt.decode(token, options={"verify_signature": False})
        logger.debug(f"Payload décodé: {json.dumps(payload, indent=2)}")
        
        # Clerk stocke l'email dans plusieurs endroits possibles
        email = None
        
        # 1. Essayer dans les claims
        if 'claims' in payload:
            logger.debug("Recherche dans claims")
            if 'email' in payload['claims']:
                email = payload['claims']['email']
                logger.debug(f"Email trouvé dans claims.email: {email}")
            elif 'primary_email_address' in payload['claims']:
                email = payload['claims']['primary_email_address']
                logger.debug(f"Email trouvé dans claims.primary_email_address: {email}")
        
        # 2. Essayer dans les champs principaux
        if not email:
            logger.debug("Recherche dans les champs principaux")
            if 'email' in payload:
                email = payload['email']
                logger.debug(f"Email trouvé dans email: {email}")
            elif 'primary_email_address' in payload:
                email = payload['primary_email_address']
                logger.debug(f"Email trouvé dans primary_email_address: {email}")
        
        # 3. Essayer dans les custom claims
        if not email and 'custom_claims' in payload:
            logger.debug("Recherche dans custom_claims")
            if 'email' in payload['custom_claims']:
                email = payload['custom_claims']['email']
                logger.debug(f"Email trouvé dans custom_claims.email: {email}")
            elif 'primary_email_address' in payload['custom_claims']:
                email = payload['custom_claims']['primary_email_address']
                logger.debug(f"Email trouvé dans custom_claims.primary_email_address: {email}")
        
        if not email:
            logger.debug("Aucun email trouvé dans le token")
            
        return email if email else 'Email non disponible'
    except Exception as e:
        logger.error(f"Erreur lors de l'extraction de l'email: {str(e)}")
        return 'Email non disponible'

def get_client_info(request: Request) -> dict:
    """Extrait les informations du client."""
    return {
        "platform": request.headers.get("sec-ch-ua-platform", "Unknown").replace('"', ''),
        "browser": "Chrome" if "chrome" in request.headers.get("user-agent", "").lower() else "Unknown"
    }

async def log_request_info(request: Request, call_next):
    """Middleware pour logger les informations de requête simplifiées."""
    # Extraction de l'email du header
    user_email = request.headers.get('x-user-email', 'Non authentifié')
    
    # Extraction des infos client
    client_info = get_client_info(request)
    
    # Log simplifié
    log_data = {
        'endpoint': request.url.path,
        'user': user_email,
        'machine': client_info
    }
    
    logger.info(json.dumps(log_data, indent=2))
    
    # Continuer le traitement de la requête
    response = await call_next(request)
    return response 