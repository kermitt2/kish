import contextlib
import asyncio
import uuid
from kisp.db import get_async_session, get_user_db, engine
from kisp.schemas import UserCreate
from kisp.users_manager import get_user_manager
from fastapi_users.exceptions import UserAlreadyExists
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError

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
        #async with get_async_session_context() as session:
        async with engine.connect() as conn:
            statement = text("""SELECT * FROM """+table)
            results = await conn.execute(statement)
            item_rows = results.all()
            items = []
            for item_row in item_rows:
                items.append(str(getattr(item_row, "id")))
    except SQLAlchemyError as e:
        error=str(e.__dict__['orig'])
        print("Fail to access items in " + table + ": " + error)
    return items

async def get_item(table, identifier):
    item = None
    try:
        #async with get_async_session_context() as session:
        async with engine.connect() as conn:
            statement = text("SELECT * FROM "+table+" WHERE id == '"+identifier+"'")
            results = await conn.execute(statement)
            item_row = results.first()
            if item_row != None:
                item = row2dict(item_row)
    except SQLAlchemyError as e:
        error=str(e.__dict__['orig'])
        print("Fail to access item in " + table + ": " + error)
    return item


async def test_init():
    '''
    Init the database with a test task, if not already present
    '''
    # Dataset
    statement = text("""INSERT INTO dataset ('id', 'name', 'description', 'image_url') values(:id, :name, :description, :image_url )""")
    local_uuid = str(uuid.uuid4())
    local_uuid = '811b64f1-323f-4a78-bdb8-ebaab44b023a'
    dataset_data = [
                     {"id": local_uuid, 
                      "name": "Softcite",
                      "description": "Software mention contexts",
                      "image_url": "images/software.png"}
                   ]
    
    try:
        async with engine.connect() as conn:
            await conn.execute(statement, dataset_data)
            await conn.commit()
    except SQLAlchemyError as e:
        error=str(e.orig)
        print("Fail to insert dataset item: " + error)

    #item = await get_item("dataset", "811b64f1-323f-4a78-bdb8-ebaab44b023a")
    #print(item)

    # insert data for the dataset
    from loader import import_classification_json
    import_classification_json("", local_uuid)

    # generate classification tasks from the dataset for 5 users, double annotations
    #generate_task(type="classification", target_annotators=5, redundancy=2, labels=["created", "used", "shared"])

