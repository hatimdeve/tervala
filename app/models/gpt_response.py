from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import re

class GPTResults(BaseModel):
    kpi_data: Optional[List[Dict[str, Any]]] = None
    modified_columns: Optional[List[str]] = None
    rows_modified: Optional[int] = None

class GPTResponse(BaseModel):
    type: str = "conversation"  # Par défaut 'conversation'
    requires_code: bool = False  # Par défaut False
    message: str
    code: Optional[str] = None
    results: Optional[GPTResults] = None

    @classmethod
    def from_raw_response(cls, raw_response: str) -> 'GPTResponse':
        """
        Parse une réponse brute de GPT et extrait le message et le code.
        """
        # Extraire le code entre les balises ###PYTHON_CODE### et ###END_CODE###
        code_pattern = r'###PYTHON_CODE###\n(.*?)\n###END_CODE###'
        code_match = re.search(code_pattern, raw_response, re.DOTALL)
        
        if code_match:
            # Extraire le message (tout ce qui précède ###PYTHON_CODE###)
            message = raw_response.split('###PYTHON_CODE###')[0].strip()
            code = code_match.group(1).strip()
            return cls(
                type="action",
                requires_code=True,
                message=message,
                code=code
            )
        else:
            # Si pas de code, toute la réponse est considérée comme un message
            return cls(
                type="conversation",
                requires_code=False,
                message=raw_response.strip()
            ) 