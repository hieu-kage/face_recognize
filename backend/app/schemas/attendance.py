from pydantic import BaseModel
from typing import List


FaceVector = List[float]

class EnrollRequest(BaseModel):
    studentId: str
    name: str
    vector: FaceVector

class SearchRequest(BaseModel):
    vector: FaceVector