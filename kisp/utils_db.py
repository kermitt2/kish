import contextlib
import asyncio
from kisp.db import get_async_session, get_user_db
from kisp.schemas import UserCreate
from kisp.users_manager import get_user_manager
from fastapi_users.exceptions import UserAlreadyExists
from sqlalchemy.sql import text

get_async_session_context = contextlib.asynccontextmanager(get_async_session)
get_user_db_context = contextlib.asynccontextmanager(get_user_db)
get_user_manager_context = contextlib.asynccontextmanager(get_user_manager)

def row2dict(row):
    return row._asdict()

async def create_user(email: str, password: str, is_superuser: bool = False, role: str = "annotator"):
    try:
        async with get_async_session_context() as session:
            async with get_user_db_context(session) as user_db:
                async with get_user_manager_context(user_db) as user_manager:
                    user = await user_manager.create(
                        UserCreate(
                            email=email, password=password, is_superuser=is_superuser, role=role
                        )
                    )
                    print(f"User created {user}")
    except UserAlreadyExists:
        print(f"User {email} already exists")

async def get_items(table):
    items = []
    try:
        async with get_async_session_context() as session:
            #async with get_user_db_context(session) as user_db:
            #async with get_user_manager_context(user_db) as user_manager:
            statement = text("""SELECT * FROM """+table)
            results = await session.execute(statement)
            item_rows = results.all()
            items = []
            for item_row in item_rows:
                items.append(str(getattr(item_row, "id")))
    except:
        print("Fail to access items in " + table)
    return items

async def get_item(table, identifier):
    item = None
    try:
        async with get_async_session_context() as session:
            #async with get_user_db_context(session) as user_db:
            #async with get_user_manager_context(user_db) as user_manager:
            statement = text("SELECT * FROM "+table+ " WHERE id="+identifier)
            results = await session.execute(statement)
            item_row = results.first()
            item = row2dict(item_row)
    except:
        print("Fail to access items in " + table)
    return item
    