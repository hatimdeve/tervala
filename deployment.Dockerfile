# -------- FRONTEND (React) --------
    FROM node:18 AS frontend
    WORKDIR /frontend
    COPY frontend/ ./       # copie ton dossier React
    RUN npm install && npm run build
    
    # -------- BACKEND (FastAPI) --------
    FROM python:3.11-slim AS backend
    WORKDIR /app
    
    # Copie le backend
    COPY app/ ./app
    COPY database/ ./database
    COPY migrations/ ./migrations
    COPY requirements.txt .
    COPY .env .
    
    # Copie frontend compilé dans app/static
    COPY --from=frontend /frontend/dist ./app/static
    
    # Install deps
    RUN pip install --no-cache-dir -r requirements.txt
    
    # Lance FastAPI avec Uvicorn
    EXPOSE 8000
    CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
    