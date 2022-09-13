import uuid

from fastapi_users import schemas
from typing import Optional

class User(schemas.BaseUser):
    first_name: Optional[str]
    last_name: Optional[str]
    role: Optional[str]

class UserRead(schemas.BaseUser[uuid.UUID]):
    first_name: Optional[str]
    last_name: Optional[str]
    role: Optional[str]

class UserCreate(schemas.BaseUserCreate):
    first_name: Optional[str]
    last_name: Optional[str]
    role: Optional[str]

class UserUpdate(schemas.BaseUserUpdate):
    first_name: Optional[str]
    last_name: Optional[str]
    role: Optional[str]
