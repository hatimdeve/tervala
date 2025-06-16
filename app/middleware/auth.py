from typing import Optional
from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import os
from dotenv import load_dotenv
import jwt
import requests
import time
from jwt.algorithms import RSAAlgorithm
import json
from base64 import b64decode
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicNumbers
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from cryptography.hazmat.backends import default_backend
import base64
import logging
from sqlalchemy.orm import Session
from ..database.config import get_db
from ..models.user import User

# Configuration du logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

load_dotenv()

# Configuration Clerk
CLERK_SECRET_KEY = os.getenv('CLERK_SECRET_KEY')
CLERK_FRONTEND_API = os.getenv("CLERK_FRONTEND_API")

if not CLERK_FRONTEND_API:
    raise ValueError("CLERK_FRONTEND_API environment variable is not set")

JWKS_URL = f"{CLERK_FRONTEND_API.rstrip('/')}/.well-known/jwks.json"

# Cache for the JWKS key
_jwks_key = None

def ensure_bytes(key):
    if isinstance(key, str):
        key = key.encode('utf-8')
    return key

def decode_base64_url(val):
    """Decode base64url-encoded string"""
    padded = val + '=' * (4 - len(val) % 4)
    return base64.urlsafe_b64decode(padded)

def jwk_to_pem(jwk):
    """Convert a JWK to PEM format"""
    try:
        logger.debug(f"Converting JWK to PEM: {jwk}")
        # Extract the exponent and modulus
        e_int = int.from_bytes(decode_base64_url(jwk['e']), 'big')
        n_int = int.from_bytes(decode_base64_url(jwk['n']), 'big')
        
        # Create the public key numbers
        public_numbers = RSAPublicNumbers(e_int, n_int)
        public_key = public_numbers.public_key(default_backend())
        
        # Get the key in PEM format
        pem = public_key.public_bytes(
            encoding=Encoding.PEM,
            format=PublicFormat.SubjectPublicKeyInfo
        )
        
        logger.debug("Successfully converted JWK to PEM")
        return pem
    except Exception as e:
        logger.error(f"Failed to convert JWK to PEM: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to convert JWK to PEM: {str(e)}")

def get_jwks_key():
    """Retrieve and cache the JWKS public key from Clerk"""
    global _jwks_key
    if not _jwks_key:
        try:
            logger.debug(f"Fetching JWKS from {JWKS_URL}")
            response = requests.get(JWKS_URL)
            response.raise_for_status()
            jwks = response.json()
            logger.debug(f"Received JWKS response: {jwks}")
            
            # Get the first key from the JWKS
            if jwks.get("keys") and len(jwks["keys"]) > 0:
                _jwks_key = jwk_to_pem(jwks["keys"][0])
                logger.debug("Successfully cached JWKS key")
            else:
                logger.error("No JWKS keys found in response")
                raise HTTPException(status_code=500, detail="No JWKS keys found")
        except Exception as e:
            logger.error(f"Failed to fetch JWKS: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch JWKS: {str(e)}")
    return _jwks_key

def sanitize_json_value(value):
    """Sanitize values to ensure they are JSON serializable"""
    if isinstance(value, (int, float)):
        if not -1e308 < float(value) < 1e308:  # Check if value is within JSON limits
            return str(value)
    return value

async def verify_auth_token(request: Request) -> Optional[str]:
    """Verify the JWT token from the Authorization header"""
    
    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.warning("Missing or invalid Authorization header")
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    # Extract the token
    token = auth_header.split(" ")[1]
    logger.debug(f"Received token: {token[:10]}...")
    
    try:
        # Get the JWKS key
        public_key = get_jwks_key()
        logger.debug("Retrieved public key from JWKS")
        
        # Decode and verify the token
        logger.debug("Attempting to decode and verify token")
        decoded = jwt.decode(
            token,
            key=public_key,
            algorithms=["RS256"],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_nbf": True,
            }
        )
        logger.debug(f"Successfully decoded token: {json.dumps(decoded, indent=2)}")
        
        # Verify time-based claims
        now = int(time.time())
        if decoded.get("exp") and float(str(decoded["exp"])) < now:
            logger.warning("Token has expired")
            raise HTTPException(status_code=401, detail="Token has expired")
        if decoded.get("nbf") and float(str(decoded["nbf"])) > now:
            logger.warning("Token not yet valid")
            raise HTTPException(status_code=401, detail="Token not yet valid")
            
        # Get the user ID from the subject claim
        user_id = decoded.get("sub")
        if not user_id:
            logger.warning("No user ID in token")
            raise HTTPException(status_code=401, detail="No user ID in token")
            
        logger.info(f"Successfully verified token for user {user_id}")
        return user_id
        
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid token: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"Error verifying token: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Error verifying token: {str(e)}")

class ClerkAuthMiddleware(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(self, request: Request, call_next):
        # Exclure le webhook Clerk de l'authentification
        if request.url.path.startswith("/webhooks/clerk"):
            return await call_next(request)
        try:
            logger.debug(f"Processing request to {request.url.path}")
            
            # Autoriser les requêtes OPTIONS sans authentification
            if request.method == "OPTIONS":
                logger.debug("Allowing OPTIONS request without authentication")
                response = await call_next(request)
                return response
            
            # Obtenir les credentials
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                logger.warning("Missing or invalid Authorization header")
                raise HTTPException(
                    status_code=401,
                    detail="Non authentifié"
                )
            
            token = auth_header.split(" ")[1]
            logger.debug(f"Extracted token: {token[:10]}...")
            
            # Vérifier le token avec l'API Clerk
            session_info = await verify_auth_token(request)
            logger.debug(f"Token verified, session info: {session_info}")
            
            # Ajouter les informations de session à la requête
            request.state.clerk_session = session_info
            request.state.user_id = session_info
            
            # Continuer vers le prochain middleware/route
            logger.debug("Proceeding to next middleware/route")
            response = await call_next(request)
            return response

        except HTTPException as e:
            logger.error(f"HTTP Exception in middleware: {str(e)}")
            raise e
        except Exception as e:
            logger.error(f"Unexpected error in middleware: {str(e)}")
            raise HTTPException(
                status_code=401,
                detail=f"Erreur d'authentification: {str(e)}"
            )

# Instance du middleware à utiliser dans l'application
auth_middleware = ClerkAuthMiddleware()

# Fonction utilitaire pour obtenir l'utilisateur actuel
async def get_current_user(request: Request) -> User:
    if not hasattr(request.state, 'clerk_session'):
        logger.warning("No clerk_session in request state")
        raise HTTPException(
            status_code=401,
            detail="Non authentifié"
        )
    
    # Obtenir une session de base de données
    db: Session = next(get_db())
    
    # Récupérer l'utilisateur depuis la base de données
    user = db.query(User).filter_by(clerk_user_id=request.state.clerk_session).first()
    if not user:
        logger.warning(f"User not found in database: {request.state.clerk_session}")
        raise HTTPException(
            status_code=401,
            detail="Utilisateur non trouvé"
        )
    
    return user

# Fonction utilitaire pour obtenir l'organisation actuelle
async def get_current_organization(request: Request):
    if not hasattr(request.state, 'org_id'):
        raise HTTPException(
            status_code=403,
            detail="Aucune organisation associée"
        )
    return request.state.org_id 