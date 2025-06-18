from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import organizations, users, webhooks, files
from .middleware.auth import auth_middleware
from .database.config import engine, Base

# Création des tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TervelA Cloud API",
    description="API pour le traitement et l'analyse de données",
    version="1.0.0"
)

# Configuration CORS - doit être avant le middleware d'authentification
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Inclusion des routers
app.include_router(webhooks.router)  # Pas de middleware auth pour les webhooks
app.include_router(organizations.router)
app.include_router(users.router)
app.include_router(files.router)

# Ajout du middleware d'authentification après CORS
app.middleware("http")(auth_middleware)

@app.get("/")
async def root():
    return {
        "message": "Bienvenue sur l'API TervelA Cloud",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    } 