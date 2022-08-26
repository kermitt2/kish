import uuid

from fastapi_users import schemas
from typing import Optional

class UserRead(schemas.BaseUser[uuid.UUID]):
    first_name: Optional[str]
    last_name: Optional[str]

class UserCreate(schemas.BaseUserCreate):
    first_name: Optional[str]
    last_name: Optional[str]

class UserUpdate(schemas.BaseUserUpdate):
    first_name: Optional[str]
    last_name: Optional[str]
