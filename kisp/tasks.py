import uuid
import json
from typing import Optional, List
from pydantic import BaseModel
from classifications import Classification
from annotations import Annotation

class Task(BaseModel):
    uuid: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None

class ClassificationTask(Task):
    classes: List[str] = []
    classifications: List[Classification] = []

    def to_dict(self):
        data = {}
        data["id"] = self.uuid
        data["name"] = self.name
        if self.description != None:
            data["description"] = self.description
        data["classes"] = self.classes
        return data

class SequenceLabelingTask(Task):
    labels: List[str] = []
    annotations: List[Annotation] = []

    def to_dict(self):
        data = {}
        data["id"] = self.uuid
        data["name"] = self.name
        if self.description != None:
            data["description"] = self.description
        data["labels"] = self.labels
        return data
