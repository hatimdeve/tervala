import pandas as pd
from typing import List, Dict, Any, Tuple
import openai
import os
from app.models.gpt_response import GPTResponse

# Configuration de l'API OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

async def generate_kpi(data: List[Dict[str, Any]], query: str) -> Tuple[List[Dict[str, Any]], str]:
    """
    Génère des KPIs à partir des données en utilisant GPT.
    
    Args:
        data: Les données à analyser
        query: La requête de l'utilisateur
        
    Returns:
        Un tuple (données KPI, message)
    """
    try:
        # Convertir les données en DataFrame
        df = pd.DataFrame(data)
        
        # Construire le message système
        system_message = """Tu es un expert en analyse de données et génération de KPIs.
        On va te donner des données et une requête pour générer des KPIs.
        Tu dois générer le code Python nécessaire pour calculer ces KPIs.
        
        Règles importantes:
        1. Utilise TOUJOURS df comme nom de variable pour le DataFrame
        2. Le code doit retourner un DataFrame avec les KPIs
        3. Assure-toi que les calculs sont corrects et pertinents
        4. Gère les erreurs potentielles (divisions par zéro, etc.)
        5. Ajoute des commentaires pour expliquer les calculs"""

        # Ajouter un aperçu des données
        data_preview = df.head(3).to_string()
        columns_info = df.dtypes.to_string()
        
        user_prompt = f"""DataFrame disponible (aperçu des 3 premières lignes):
        {data_preview}
        
        Types des colonnes:
        {columns_info}
        
        Requête KPI: {query}"""

        # Appeler l'API GPT
        response = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )

        # Obtenir la réponse de GPT
        message_content = response.choices[0].message.content
        gpt_response = GPTResponse.from_raw_response(message_content)

        # Si c'est une réponse de type conversation
        if gpt_response.type == "conversation" or not gpt_response.requires_code:
            return [], gpt_response.message

        # Si du code a été généré, l'exécuter
        if gpt_response.code:
            # Créer un environnement local pour l'exécution
            local_vars = {'df': df.copy(), 'pd': pd}
            
            # Exécuter le code
            exec(gpt_response.code, {}, local_vars)
            
            # Récupérer le DataFrame des KPIs
            df_kpi = local_vars.get('df_kpi', None)
            
            if df_kpi is not None and isinstance(df_kpi, pd.DataFrame):
                return df_kpi.to_dict('records'), gpt_response.message
            else:
                return [], "❌ Le code n'a pas produit de KPIs valides"

        return [], "❌ Aucun code n'a été généré pour calculer les KPIs"

    except Exception as e:
        error_msg = f"❌ Erreur lors de la génération des KPIs: {str(e)}"
        print(error_msg)
        return [], error_msg 