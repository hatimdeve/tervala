# pyright: reportMissingImports=false

import os
import re
import openai
import pandas as pd
from typing import Optional, Tuple
from dotenv import load_dotenv
import numpy as np
import math
import json

# Chargement de la clé API depuis le fichier .env
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY", "")

# --- 🔌 Fonctions d'enrichissement disponibles ---
from app.services.enrichment import enrich_with_lookup, add_concatenated_column

# --- 🧹 Fonctions de nettoyage manuelles ---

def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    return df.drop_duplicates()

def clear_column(df: pd.DataFrame, column: str) -> pd.DataFrame:
    if column in df.columns:
        df[column] = ''
    return df

def format_phone_column(df: pd.DataFrame, column: str) -> pd.DataFrame:
    if column in df.columns:
        df[column] = df[column].astype(str).apply(lambda x: re.sub(r'\D', '', x))
        df[column] = df[column].str.replace(r'^0', '+212', regex=True)
    return df

def standardize_date_column(df: pd.DataFrame, column: str, output_format: str = "%Y-%m-%d") -> pd.DataFrame:
    if column in df.columns:
        df[column] = pd.to_datetime(df[column], errors='coerce').dt.strftime(output_format)
    return df

def capitalize_text_column(df: pd.DataFrame, column: str) -> pd.DataFrame:
    if column in df.columns:
        df[column] = df[column].astype(str).str.title()
    return df

def clean_numeric_values(df: pd.DataFrame) -> pd.DataFrame:
    """
    Nettoie les valeurs numériques non conformes à JSON dans un DataFrame.
    
    Args:
        df: DataFrame à nettoyer
        
    Returns:
        DataFrame nettoyé
    """
    def clean_value(val):
        try:
            if pd.isna(val):  # Vérifie NaN, None, etc.
                return None
            if isinstance(val, (np.integer, np.floating)):
                val = val.item()  # Convertit les types numpy en types Python natifs
            if isinstance(val, (float, int)):
                if math.isinf(val) or math.isnan(val):
                    return str(val)
                # Vérifier si le nombre est trop grand pour JSON
                if abs(val) > 1e308:  # Limite max de JSON
                    return str(val)
            if isinstance(val, (dict, list)):
                try:
                    return json.dumps(val)  # Convertit les objets complexes en JSON
                except:
                    return str(val)  # Fallback en string si la conversion JSON échoue
            # Test final de sérialisation JSON
            json.dumps(val)  # Si ça échoue, on convertit en string
            return val
        except:
            return str(val)  # Conversion en string pour toute valeur problématique

    # Créer une copie pour éviter les modifications en place
    df_clean = df.copy()
    
    # Appliquer le nettoyage à chaque colonne
    for col in df_clean.columns:
        df_clean[col] = df_clean[col].map(clean_value)
        
    return df_clean

# --- 🤖 Fonction GPT : application d'une règle utilisateur ---

from app.models.gpt_response import GPTResponse

async def apply_user_rule(df: pd.DataFrame, user_prompt: str) -> Tuple[Optional[pd.DataFrame], str]:
    try:
        # Convertir toutes les colonnes en chaînes de caractères
        columns = [str(col) for col in df.columns.tolist()]
        
        # Logs initiaux
        print("\n" + "="*50)
        print("👤 PROMPT UTILISATEUR:")
        print(f"'{user_prompt}'")
        print("="*50)

        # Détection de langue améliorée
        english_phrases = [
            'what', 'how', 'can you', 'could you', 'please', 'help', 'need', 'want',
            'hey what', 'hi there', 'hello', "what's up", 'thanks', 'thank you'
        ]
        french_phrases = [
            'bonjour', 'salut', 'peux-tu', 'pourrais-tu', 'aide-moi', "j'ai besoin",
            'je voudrais', 'merci', "s'il te plaît", 'stp', 'comment'
        ]
        
        user_prompt_lower = user_prompt.lower()
        english_matches = sum(1 for phrase in english_phrases if phrase in user_prompt_lower)
        french_matches = sum(1 for phrase in french_phrases if phrase in user_prompt_lower)
        has_french_chars = any(char in user_prompt_lower for char in 'éèêëàâäôöûüçîïœæ')

        # Log de la détection de langue
        print("\n🔍 DÉTECTION DE LANGUE:")
        print(f"- Matches anglais: {english_matches}")
        print(f"- Matches français: {french_matches}")
        print(f"- Caractères français: {'Oui' if has_french_chars else 'Non'}")
        print("="*50)
        
        is_english = (english_matches > french_matches and not has_french_chars) or (
            english_matches > 0 and french_matches == 0 and not has_french_chars
        )

        # Construction du system prompt de base pour la manipulation des données
        base_system_prompt = """You are a friendly data cleaning assistant. 🌟

CRITICAL RULES:

1. LANGUAGE:
   - If user speaks English → respond in English
   - If user speaks French → respond in French
   - NEVER mix languages
   - Values in the data should match user's language (green/vert)

2. CODE FORMAT:
   You MUST use this EXACT format for code:
   [Your friendly message]
   ###PYTHON_CODE###
   [Your Python code here]
   ###END_CODE###

3. EXAMPLES:
   ❌ WRONG:
   "Sure! [Internal code: df = df[df['Catégorie'] == 'football']]"
   
   ✅ CORRECT:
   "Let's keep only the football category! ⚽️"
   ###PYTHON_CODE###
   df = df[df['Catégorie'].str.lower() == 'football']
   ###END_CODE###

4. RESPONSES:
   - Be friendly and use emojis
   - Keep it short and sweet
   - NEVER explain technical details
   - ALWAYS use ###PYTHON_CODE### format for code"""

        # Detect language and prepare instruction
        is_french = any(word in user_prompt.lower() for word in ['bonjour', 'salut', 'peux', 'pouvez', 'voudrais', 'veux'])
        
        if is_french:
            instruction = f"""Colonnes disponibles : {', '.join(columns)}

Demande : "{user_prompt}"

RÈGLES :
1. Répondre UNIQUEMENT en français
2. Être amical et utiliser des emojis
3. Format EXACT pour le code :
   [Message amical]
   ###PYTHON_CODE###
   [Code Python]
   ###END_CODE###
4. Utiliser les noms EXACTS des colonnes : {', '.join(columns)}"""
        else:
            instruction = f"""Available columns: {', '.join(columns)}

Request: "{user_prompt}"

RULES:
1. Respond ONLY in English
2. Be friendly and use emojis
3. EXACT format for code:
   [Friendly message]
   ###PYTHON_CODE###
   [Python code]
   ###END_CODE###
4. Use EXACT column names: {', '.join(columns)}"""

        # Obtenir la réponse de GPT avec la nouvelle syntaxe
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
        
        # Parser la réponse avec notre nouvelle classe
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
            return df, gpt_response.message
            
        # Pour les opérations sur les données
        if gpt_response.code:
            # Sauvegarder l'état initial
            rows_before = len(df)
            df_before = df.copy()
            
            # Exécuter le code
            local_vars = {"df": df.copy(), "pd": pd, "re": re}
            exec(gpt_response.code, {}, local_vars)
            df = local_vars.get("df", df)
            
            # Nettoyer les valeurs numériques avant de continuer
            df = clean_numeric_values(df)
            
            # Afficher les résultats de l'opération
            print("\n📊 RÉSULTATS DE L'OPÉRATION:")
            rows_after = len(df)
            
            # Log des modifications de données
            print("\n📈 STATISTIQUES:")
            if rows_before != rows_after:
                print(f"- Lignes avant: {rows_before}")
                print(f"- Lignes après: {rows_after}")
                print(f"- Lignes modifiées: {abs(rows_before - rows_after)}")
            
            # Vérifier les modifications de colonnes
            changed_cols = []
            for col in df.columns:
                # Réinitialiser les index pour la comparaison
                df_col = df[col].reset_index(drop=True)
                df_before_col = df_before[col].reset_index(drop=True)
                if not df_col.equals(df_before_col):
                    changed_cols.append(col)
            
            if changed_cols:
                print("\n🔄 COLONNES MODIFIÉES:")
                for col in changed_cols:
                    print(f"- {col}")
                    # Afficher un échantillon des modifications
                    try:
                        # Utiliser une méthode plus robuste pour comparer
                        df_merged = pd.merge(
                            df_before[[col]].reset_index(),
                            df[[col]].reset_index(),
                            left_index=True,
                            right_index=True,
                            suffixes=('_before', '_after')
                        )
                        df_merged = df_merged[df_merged[f"{col}_before"] != df_merged[f"{col}_after"]]
                        print("  Exemple de modifications:")
                        for _, row in df_merged.head(3).iterrows():
                            print(f"  • Avant: {row[f'{col}_before']}")
                            print(f"    Après: {row[f'{col}_after']}")
                    except Exception as e:
                        print(f"  ⚠️ Impossible d'afficher les exemples: {str(e)}")
        else:
            print("\n❌ ERREUR:")
            print("No code found in the response")
            
        print("="*50)
        return df, gpt_response.message
            
    except Exception as e:
        print(f"\n❌ ERREUR: {str(e)}")
        print("\n🔍 DÉTAILS DE L'ERREUR:")
        import traceback
        print(traceback.format_exc())
        print("="*50)
        raise e 