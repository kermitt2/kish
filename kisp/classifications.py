import json
import uuid

from typing import Optional
from pydantic import BaseModel

class Classification(BaseModel):

    class_value: str = None



    