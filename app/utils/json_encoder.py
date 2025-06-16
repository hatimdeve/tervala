import json
import numpy as np
import math
from typing import Any

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