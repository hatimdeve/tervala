# pyright: reportMissingImports=false

import os
import re
import openai
import pandas as pd
import numpy as np
from typing import Optional, Tuple, Dict, Any, List
from dotenv import load_dotenv

# Chargement de la clé API depuis le fichier .env
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY", "")

# --- 📊 Fonctions d'analyse de base ---

def calculate_basic_stats(df: pd.DataFrame, column: str) -> Dict[str, Any]:
    """Calcule les statistiques de base pour une colonne numérique."""
    if column not in df.columns:
        return {}
    
    try:
        stats = {
            "mean": df[column].mean(),
            "median": df[column].median(),
            "std": df[column].std(),
            "min": df[column].min(),
            "max": df[column].max()
        }
        return {k: float(v) if pd.notnull(v) else None for k, v in stats.items()}
    except:
        return {}

def calculate_frequencies(df: pd.DataFrame, column: str, top_n: int = 5) -> Dict[str, int]:
    """Calcule les fréquences des valeurs dans une colonne."""
    if column not in df.columns:
        return {}
    
    return df[column].value_counts().head(top_n).to_dict()

# --- 🤖 Fonction principale d'analyse avec GPT ---

from app.models.gpt_response import GPTResponse

async def analyze_data(df: pd.DataFrame, user_prompt: str) -> Tuple[Optional[List[Dict[str, Any]]], str]:
    try:
        # Log de la question de l'utilisateur
        print("\n❓ QUESTION DE L'UTILISATEUR:")
        print(f"{user_prompt}")
        print("="*50)

        # Détection améliorée des requêtes conversationnelles
        conversation_keywords = {
            # Salutations
            'bonjour', 'salut', 'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
            # Questions de politesse
            'ça va', 'how are you', 'how\'s it going', 'what\'s up', 'sup', 
            # Remerciements
            'merci', 'thanks', 'thank you', 'thx',
            # Au revoir
            'au revoir', 'goodbye', 'bye', 'see you', 'cya', 'à bientôt',
            # Questions générales
            'comment vas-tu', 'how are you doing', 'how do you do',
            # Expressions courantes
            'nice', 'cool', 'super', 'great', 'awesome', 'ok', 'okay', 'd\'accord'
        }
        
        # Si le prompt contient principalement des mots de conversation, traiter comme conversation
        user_prompt_lower = user_prompt.lower()
        words = set(user_prompt_lower.split())
        
        # Si plus de 30% des mots sont conversationnels, traiter comme une conversation
        conversation_words = words.intersection(conversation_keywords)
        if len(conversation_words) > 0 and len(conversation_words) / len(words) >= 0.3:
            return None, user_prompt

        # Détection de langue plus précise
        french_indicators = ['je', 'tu', 'il', 'nous', 'vous', 'ils', 'le', 'la', 'les', 'un', 'une', 'des', 
                           'pour', 'par', 'avec', 'sans', 'dans', 'sur', 'sous', 'entre', 'chez',
                           'peux', 'veux', 'faut', 'dois', 'montre', 'affiche', 'calcule', 'analyse',
                           'combien', 'quel', 'quelle', 'quels', 'quelles', 'pourquoi', 'comment']
        
        # Vérifier si le texte contient des mots français spécifiques
        is_french = any(word in user_prompt_lower.split() for word in french_indicators)
        
        # Construction du system prompt spécifique pour l'analyse
        base_system_prompt = """You are a data analysis assistant specialized in generating KPIs and insights. 🎯

CRITICAL RULES:

1. LANGUAGE:
   - If user speaks French → ALWAYS respond in French
   - If user speaks English → respond in English
   - NEVER mix languages

2. CODE FORMAT:
   You MUST use this EXACT format for code:
   [Your friendly message]
   ###PYTHON_CODE###
   result = [Your Python code here that MUST return data in a DataFrame format]
   ###END_CODE###

3. CODE REQUIREMENTS:
   - NEVER try to read or load data - use the existing 'df' DataFrame
   - Code MUST assign the final DataFrame to the 'result' variable
   - DO NOT force any specific columns (like 'unit' or 'description')
   - Let the data structure be determined by the user's request
   - Keep only the essential columns that were asked for

4. RESPONSES:
   - Be friendly and use emojis
   - Keep it short and sweet
   - Focus on generating exactly what was asked
   - ALWAYS use ###PYTHON_CODE### format"""

        # Ajouter un aperçu des données
        data_preview = df.head(3).to_string()
        columns_info = df.dtypes.to_string()
        
        if is_french:
            instruction = f"""Colonnes disponibles : {', '.join(df.columns)}

Aperçu des données (3 premières lignes):
{data_preview}

Types des colonnes:
{columns_info}

Demande : "{user_prompt}"

RÈGLES :
1. Répondre UNIQUEMENT en français
2. Être amical et utiliser des emojis
3. Format EXACT pour le code :
   [Message amical]
   ###PYTHON_CODE###
   [Code Python qui retourne les données dans un format simple]
   ###END_CODE###
4. Utiliser les noms EXACTS des colonnes disponibles
5. NE PAS forcer de colonnes spécifiques (comme 'unit' ou 'description')
6. Laisser la structure des données être déterminée par la demande
7. NE JAMAIS essayer de lire ou charger des données - utiliser le DataFrame 'df' existant"""
        else:
            instruction = f"""Available columns: {', '.join(df.columns)}

Data preview (first 3 rows):
{data_preview}

Column types:
{columns_info}

Request: "{user_prompt}"

RULES:
1. Respond ONLY in English
2. Be friendly and use emojis
3. EXACT format for code:
   [Friendly message]
   ###PYTHON_CODE###
   [Python code that returns data in a simple format]
   ###END_CODE###
4. Use EXACT column names from available columns
5. DO NOT force specific columns (like 'unit' or 'description')
6. Let the data structure be determined by the request
7. NEVER try to read or load data - use the existing 'df' DataFrame"""

        # Obtenir la réponse de GPT
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": base_system_prompt
                },
                {
                    "role": "user",
                    "content": instruction
                }
            ],
            temperature=0.7
        )
        
        message_content = response.choices[0].message.content.strip()
        
        # Parser la réponse
        gpt_response = GPTResponse.from_raw_response(message_content)
        
        # Logs détaillés de la réponse GPT
        print("\n🤖 RÉPONSE GPT DÉTAILLÉE:")
        print(f"- Type: {gpt_response.type}")
        print(f"- Requiert du code: {gpt_response.requires_code}")
        print(f"- Message: {gpt_response.message}")
        if gpt_response.code:
            print("\n🔧 CODE PYTHON GÉNÉRÉ:")
            print(gpt_response.code)
        
        # Si c'est une conversation, retourner directement
        if gpt_response.type == "conversation" or not gpt_response.requires_code:
            print("\n✨ RÉPONSE CONVERSATIONNELLE")
            print("="*50)
            return None, gpt_response.message
            
        # Pour l'analyse des données
        if gpt_response.code:
            # Sauvegarder l'état initial
            rows_before = len(df)
            df_before = df.copy()
            
            # Exécuter le code
            local_vars = {
                "df": df.copy(),
                "pd": pd,
                "np": np,
                "re": re,
                "calculate_basic_stats": calculate_basic_stats,
                "calculate_frequencies": calculate_frequencies
            }
            
            exec(gpt_response.code, {}, local_vars)
            
            # Récupérer le résultat et le convertir en liste de dictionnaires
            result_df = local_vars.get("result", None)
            if result_df is not None and isinstance(result_df, pd.DataFrame):
                kpi_data = result_df.to_dict('records')
            else:
                raise ValueError("Le code doit retourner un DataFrame dans la variable 'result'")

            print("\n📊 RÉSULTATS DE L'OPÉRATION:")
            print(result_df)
            print("="*50)
            
            return kpi_data, gpt_response.message
            
        else:
            print("\n❌ ERREUR: Aucun code trouvé dans la réponse")
            print("="*50)
            return None, "Erreur : Aucun code d'analyse n'a été généré."
            
    except Exception as e:
        print(f"\n❌ ERREUR: {str(e)}")
        print("\n🔍 DÉTAILS DE L'ERREUR:")
        import traceback
        print(traceback.format_exc())
        print("="*50)
        raise e 