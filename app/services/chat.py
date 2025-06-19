from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph
from langchain_core.runnables import RunnableWithMessageHistory
from langchain_core.messages import AIMessage, HumanMessage, BaseMessage
from langchain_community.chat_message_histories import ChatMessageHistory
from typing import Dict, Any, TypedDict, List
import pandas as pd
import re
import uuid
from langchain_core.prompts import PromptTemplate
from app.database.config import get_db
from app.models.history_cleaning import ActionHistory

# 🧠 Mémoire de session
memory_store = {}
df_history_store = {}

def get_session_history(session_id: str):
    if session_id not in memory_store:
        memory_store[session_id] = ChatMessageHistory()
    return memory_store[session_id]

# 🔮 LLM
llm = ChatOpenAI(model="gpt-4-turbo", temperature=0)

code_prompt = ChatPromptTemplate.from_messages([
    ("system", """
Tu es un expert en pandas.

✅ Si l'utilisateur demande une action sur un DataFrame, modifie directement le DataFrame `df`. Tu dois TOUJOURS faire des opérations de ce type : `df = df[...]` ou `df.drop(...)` etc.

⚠️ Ne crée JAMAIS de nouvelles variables comme `filtered_df`, `new_df`, etc.

❌ N'utilise jamais `data = {{{{...}}}}` ni `pd.DataFrame({{{{...}}}})`.

✅ Si le message est une salutation ou une demande sans rapport avec pandas, réponds normalement.

DataFrame (extrait) :
{df_sample}
"""),
    ("human", "{instruction}")
])


title_description_prompt = PromptTemplate.from_template("""
Tu es un assistant intelligent. Génère un **titre** et une **courte description claire** (en une phrase) de l'action suivante appliquée à un DataFrame Pandas :

Instruction utilisateur : "{instruction}"

Code exécuté :
```python
{code}
""")
def generate_title_description(instruction: str, code: str) -> Dict[str, str]:
    prompt_input = title_description_prompt.format(instruction=instruction, code=code)
    response = llm.invoke(prompt_input)
    
    match_title = re.search(r"Titre\s*:\s*(.*)", response.content)
    match_desc = re.search(r"Description\s*:\s*(.*)", response.content)
    
    return {
        "title": match_title.group(1).strip() if match_title else "Action sans titre",
        "description": match_desc.group(1).strip() if match_desc else "Pas de description générée."
    }
# 🔧 Génère du code à partir du prompt utilisateur
def generate_code(df: pd.DataFrame, instruction: str) -> str:
    df_sample = df.head().to_string()
    chain = code_prompt | llm
    result = chain.invoke({"instruction": instruction, "df_sample": df_sample})
    match = re.search(r"```python(.*?)```", result.content, re.DOTALL)
    return match.group(1).strip() if match else ""

def exec_code_on_df(code: str, df: pd.DataFrame) -> (pd.DataFrame, str):
    local_vars = {"df": df.copy()}
    try:
        exec(code, {"pd": pd}, local_vars)

        # ✅ On récupère toujours `df`, qu'il ait été modifié ou non
        df_result = local_vars.get("df", df)
        return df_result, f"✅ Action appliquée avec succès.\n\n```python\n{code}\n```"
    except Exception as e:
        return df, f"❌ Erreur : {str(e)}"


# 🔁 Nœud principal LangGraph avec gestion de l'annulation
def decide_and_apply(state: Dict[str, Any]) -> Dict[str, Any]:
    messages = state.get("messages", [])
    if not messages or not isinstance(messages[-1], HumanMessage):
        return {
            **state,
            "message": "❌ Aucun message utilisateur valide.",
            "output": {
                "df": state["df"],
                "message": "❌ Aucun message utilisateur valide.",
                "session_id": state["session_id"],
                "df_history": state.get("df_history", [state["df"].copy()])
            }
        }

    instruction = messages[-1].content
    df = state["df"]
    df_history = state.get("df_history", [df.copy()])

    # 🔙 Undo
    cancel_keywords = ["undo", "annule", "reviens", "revenir", "retour", "revient", "revenir en arrière"]
    if any(kw in instruction.lower() for kw in cancel_keywords):
        if len(df_history) > 1:
            df_history.pop()
            df_previous = df_history[-1]
            return {
                **state,
                "df": df_previous,
                "df_history": df_history,
                "message": "↩️ Dernière action annulée.",
                "output": {
                    "df": df_previous,
                    "message": "↩️ Dernière action annulée.",
                    "session_id": state["session_id"],
                    "df_history": df_history
                }
            }
        else:
            return {
                **state,
                "message": "⚠️ Aucune action précédente à annuler.",
                "output": {
                    "df": df,
                    "message": "⚠️ Aucune action précédente à annuler.",
                    "session_id": state["session_id"],
                    "df_history": df_history
                }
            }

    # 💬 Appel LLM
    code = generate_code(df, instruction)
    
    if not code.strip():
        response = llm.invoke(messages)
        return {
            **state,
            "message": response.content,
            "df_history": df_history,
            "output": {
                "df": df,
                "message": response.content,
                "session_id": state["session_id"],
                "df_history": df_history
            }
        }

    df_new, message = exec_code_on_df(code, df)
    meta = generate_title_description(instruction, code)
    title, description = meta["title"], meta["description"]

    # Tu peux maintenant logger, afficher ou sauvegarder ça :
    print("🔖", title)
    print("📝", description)
    df_history.append(df_new.copy()) 
# 📥 Sauvegarde BDD
    try:
      db = next(get_db())  # ✅ Récupère la vraie session depuis le générateur        
      action = ActionHistory(
        session_id=state["session_id"],
        instruction=instruction,
        generated_code=code,
        title=title,
        description=description
    )
      db.add(action)
      db.commit()
    except Exception as e:
      print(f"❌ Erreur DB: {e}")
    finally:
      db.close()
    return {
        "df": df_new,
        "df_history": df_history,
        "messages": messages,
        "session_id": state["session_id"],
        "chat_history": state.get("chat_history", []),
        "message": message,
        "output": {
            "df": df_new,
            "message": message,
            "session_id": state["session_id"],
            "df_history": df_history
        }
    }


# 📦 État de la session avec historique
class AppState(TypedDict):
    df: pd.DataFrame
    df_history: List[pd.DataFrame]
    messages: List[BaseMessage]
    session_id: str
    message: str
    chat_history: List[BaseMessage]

# 🔁 Graphe LangGraph
def build_graph():
    graph = StateGraph(AppState)
    graph.add_node("decide_and_apply", decide_and_apply)
    graph.set_entry_point("decide_and_apply")
    graph.set_finish_point("decide_and_apply")
    return graph.compile()

runnable_graph = build_graph()

# 💬 LLM avec mémoire
graph_with_memory = RunnableWithMessageHistory(
    runnable_graph,
    get_session_history,
    input_messages_key="messages",
    history_messages_key="chat_history"
)
