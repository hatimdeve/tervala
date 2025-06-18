from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional, Tuple
from ..database.config import get_db
from ..models.file_process import FileProcess
from ..models.user import User
from ..schemas.file import FileProcessCreate, FileProcessResponse, ProcessingResponse, FileProcessUpdate
from ..services.file import FileService
from ..middleware.auth import get_current_user
import pandas as pd
import json
from app.services.cleaner import apply_user_rule, clean_numeric_values
import numpy as np
import math
import logging
import traceback
from datetime import datetime
from app.utils.json_encoder import serialize_with_custom_encoder
from app.services.chat import graph_with_memory
from langchain_core.messages import HumanMessage
import uuid
from app.services.chat import get_session_history, memory_store,df_history_store  
router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload", response_model=FileProcessResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload et initialisation du traitement d'un fichier"""
    file_service = FileService(db)
    return await file_service.upload(file, current_user)

@router.post("/{file_id}/process", response_model=ProcessingResponse)
async def process_file(
    file_id: str,
    rules: List[str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lancer le traitement d'un fichier avec les règles spécifiées"""
    file_service = FileService(db)
    return await file_service.process(file_id, rules, current_user)

@router.get("/{file_id}/status", response_model=FileProcessResponse)
async def get_file_status(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir le statut d'un traitement de fichier"""
    file_service = FileService(db)
    return await file_service.get_status(file_id, current_user)

@router.get("/history", response_model=List[FileProcessResponse])
async def get_processing_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtenir l'historique des traitements de fichiers"""
    file_service = FileService(db)
    return await file_service.get_history(current_user)

# Utilitaires pour la sérialisation
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer, np.floating)):
            return obj.item()
        if isinstance(obj, (float, np.float64)):
            if math.isinf(obj) or math.isnan(obj):
                return str(obj)
        return super().default(obj)

def serialize_with_custom_encoder(obj: Any) -> str:
    return json.dumps(obj, cls=CustomJSONEncoder)

def log_request(request: Request, endpoint: str):
    auth_header = request.headers.get('Authorization', 'No Auth Header')
    logging.info(f"""
🔐 Requête authentifiée sur {endpoint}:
- Headers: {dict(request.headers)}
- Auth: {auth_header}
- Client: {request.client}
- Timestamp: {datetime.now().isoformat()}
""")

@router.post("/quick-upload")
async def quick_upload_file(request: Request, file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Endpoint pour télécharger un fichier et le convertir en DataFrame (rapide, sans base).
    """
    try:
        log_request(request, "/files/quick-upload")
        logging.info(f"📁 Traitement du fichier: {file.filename}")
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file.file)
            logging.info(f"✅ Fichier CSV lu avec succès: {len(df)} lignes")
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file.file)
            logging.info(f"✅ Fichier Excel lu avec succès: {len(df)} lignes")
        else:
            logging.error(f"❌ Format de fichier non supporté: {file.filename}")
            raise HTTPException(status_code=400, detail="Format de fichier non supporté")
        data = df.to_dict('records')
        columns = df.columns.tolist()
        content = {
            "message": "Fichier traité avec succès",
            "data": data,
            "columns": columns
        }
        logging.info("✅ Données converties et prêtes à être envoyées")
        return JSONResponse(content=json.loads(serialize_with_custom_encoder(content)))
    except Exception as e:
        logging.error(f"""
❌ Erreur lors du traitement du fichier:
- Type: {type(e).__name__}
- Message: {str(e)}
- Traceback:
{traceback.format_exc()}
""")
        raise HTTPException(status_code=500, detail=str(e))

# @router.post("/quick-process")
# async def quick_process_file(request: Request, data: Dict[str, Any]) -> Dict[str, Any]:
#     """
#     Endpoint pour traiter un fichier avec une règle de nettoyage (rapide, sans base).
#     """
#     try:
#         df = pd.DataFrame(data["data"])
#         prompt = data["prompt"]
#         df_result, message = await apply_user_rule(df, prompt)
#         if "Salut" in message or "Bonjour" in message or "Hello" in message:
#             content = {
#                 "message": message,
#                 "data": data["data"]
#             }
#         else:
#             df_result = clean_numeric_values(df_result)
#             result_data = df_result.to_dict('records')
#             content = {
#                 "message": message,
#                 "data": result_data
#             }
#         return JSONResponse(content=json.loads(serialize_with_custom_encoder(content)))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
@router.post("/quick-process")
async def quick_process_file(request: Request):
    try:
        data = await request.json()
        prompt = data["prompt"]
        session_id = data.get("session_id") or str(uuid.uuid4())

        # 🧠 Récupère l'historique de messages
        chat_history = get_session_history(session_id)
        previous_messages = chat_history.messages if hasattr(chat_history, "messages") else []

        # 🧠 Récupère ou initialise df_history
        if session_id in df_history_store:
            df_history = df_history_store[session_id]
        else:
            df_initial = pd.DataFrame(data["data"])
            df_initial = df_initial.replace(r'^\s*$', None, regex=True)
            df_initial = df_initial.where(pd.notnull(df_initial), None)
            df_initial.dropna(how="all", inplace=True)
            df_history = [df_initial]

        # ✅ Point de départ : dernier état connu du DataFrame
        df = df_history[-1]

        # 🧠 Construction de l’état LangGraph
        state = {
            "messages": [HumanMessage(content=prompt)],
            "df": df,
            "df_history": df_history,
            "session_id": session_id
        }

        # 🔁 Appel à LangGraph avec mémoire
        result = await graph_with_memory.ainvoke(
            state,
            config={"configurable": {"session_id": session_id}}
        )

        # 💾 Sauvegarde du df_history mis à jour
        if "output" in result and "df_history" in result["output"]:
            df_history_store[session_id] = result["output"]["df_history"]
        else:
            df_history_store[session_id] = result.get("df_history", [df.copy()])

        # ✅ Réponse
        df = result["df"].copy()
        for col in df.select_dtypes(include=["datetime", "datetimetz"]):
            df[col] = df[col].astype(str)
        return JSONResponse(content={
            "data": df.to_dict(orient="records"),
            "message": result["message"],
            "session_id": session_id
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/gpt")
async def gpt_analyze(data: Dict[str, Any], request: Request) -> Dict[str, Any]:
    """
    Endpoint pour analyser les données et générer des KPIs avec GPT (rapide, sans base).
    """
    try:
        prompt = data["prompt"]
        df = pd.DataFrame(data.get("data", []))
        kpi_data, message = await analyze_data(df, prompt)
        content = {
            "message": message,
            "kpi_data": kpi_data
        }
        return JSONResponse(content=json.loads(serialize_with_custom_encoder(content)))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def analyze_data(df: pd.DataFrame, prompt: str) -> Tuple[Optional[List[Dict[str, Any]]], str]:
    try:
        if "Salut" in prompt or "Bonjour" in prompt or "Hello" in prompt:
            return None, f"Bonjour ! Comment puis-je vous aider avec vos données aujourd'hui ? 😊"
        df_result, message = await apply_user_rule(df, prompt)
        if df_result is None:
            return None, message
        df_result = clean_numeric_values(df_result)
        kpi_data = [
            {
                "kpi_name": col,
                "value": df_result[col].mean() if pd.api.types.is_numeric_dtype(df_result[col]) else None,
                "unit": "",
                "description": f"Moyenne de {col}"
            }
            for col in df_result.columns
            if pd.api.types.is_numeric_dtype(df_result[col])
        ]
        return kpi_data, message
    except Exception as e:
        return None, f"Erreur lors de l'analyse: {str(e)}" 