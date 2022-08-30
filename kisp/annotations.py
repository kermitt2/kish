import json
import uuid

from typing import Optional
from pydantic import BaseModel

class Annotation(BaseModel):

    label: str = None
    start: int = -1
    end: int = -1
    chunk: str = None

