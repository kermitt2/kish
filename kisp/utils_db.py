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

'''
    Some facilitator async functions for the SQL DB
    Note: we use SQLAlchemy CORE for the tables, except user table which relies 
    on fastapi.users and uses its own SQLAlchemy ORM stuff 
'''

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

async def get_items(table, offset_from=-1, offset_to=-1):
    items = []
    try:
        async with engine.connect() as conn:
            statement = """SELECT * FROM """+table
            if offset_to != -1 and (offset_from == -1 or offset_from == 0):
                statement += " LIMIT " + str(offset_to)
            elif offset_to != -1 and offset_to > offset_from:
                limit = offset_to - offset_from
                statement += " LIMIT " + str(limit)
            if offset_from != -1 and offset_from != 0:
                statement += " OFFSET " + str(offset_from)
            statement = text(statement)
            results = await conn.execute(statement)
            item_rows = results.all()
            if len(item_rows) == 0:
                return items
            for item_row in item_rows:
                items.append(str(getattr(item_row, "id")))
    except SQLAlchemyError as e:
        error=str(e.__dict__['orig'])
        print("Fail to access records in " + table + ": " + error)
    return items

async def get_item(table, identifier):
    item = None
    try:
        async with engine.connect() as conn:
            statement = text("SELECT * FROM "+table+" WHERE id = '"+identifier+"'")
            results = await conn.execute(statement)
            item_row = results.first()
            if item_row != None:
                item = row2dict(item_row)
    except SQLAlchemyError as e:
        error=str(e.__dict__['orig'])
        print("Fail to access record in " + table + ": " + error)
    return item

async def get_items_by_field_value(table, field, value, offset_from=-1, offset_to=-1):
    items = []
    try:
        async with engine.connect() as conn:
            statement = "SELECT * FROM "+table+" WHERE "+field+" = '"+value+"'"
            if offset_to != -1 and (offset_from == -1 or offset_from == 0):
                statement += " LIMIT " + str(offset_to)
            elif offset_to != -1 and offset_to > offset_from:
                limit = offset_to - offset_from
                statement += " LIMIT " + str(limit)
            if offset_from != -1 and offset_from != 0:
                statement += " OFFSET " + str(offset_from)
            statement = text(statement)
            results = await conn.execute(statement)
            item_rows = results.all()
            if len(item_rows) == 0:
                return items
            for item_row in item_rows:
                items.append(row2dict(item_row))
    except SQLAlchemyError as e:
        error=str(e.__dict__['orig'])
        print("Fail to access records in " + table + ": " + error)
    return items

async def get_first_item_by_field_value(table, field, value):
    item = None
    try:
        async with engine.connect() as conn:
            statement = text("SELECT * FROM "+table+" WHERE "+field+" = '"+value+"'")
            results = await conn.execute(statement)
            item_row = results.first()
            if item_row != None:
                item = row2dict(item_row)
    except SQLAlchemyError as e:
        error=str(e.__dict__['orig'])
        print("Fail to access record in " + table + ": " + error)
    return item

async def insert_item(table, record_as_dict, add_id=True):
    statement = "INSERT INTO " + table
    if add_id and "id" not in record_as_dict:
        local_uuid = str(uuid.uuid4())
        record_as_dict["id"] = local_uuid

    statement_piece = " ("
    start = True
    for key in record_as_dict:
        if start:
            start = False
        else:
            statement_piece += ", "
        statement_piece += "'"+key+"'"
    statement_piece += ") "

    statement += statement_piece

    statement_piece = "values("
    start = True
    for key in record_as_dict:
        if start:
            start = False
        else:
            statement_piece += ", "
        statement_piece += ":"+key

    statement_piece += ")"
    statement += statement_piece
    statement = text(statement)

    try:
        async with engine.connect() as conn:
            await conn.execute(statement, record_as_dict)
            await conn.commit()
    except SQLAlchemyError as e:
        error=str(e.orig)
        print("Fail to insert "+ table + " record: " + error)

    if "id" in record_as_dict:
        return record_as_dict["id"]
    else:
        return 

async def update_record(table, record_id, record_dict):
    statement = "UPDATE " + table + " SET " 
    start = True
    for key in record_dict:
        if start:
            start = False
        else:
            statement += ", "
        statement += key + " = " + str(record_dict[key])
    statement += " WHERE id = '" + record_id + "'";
    statement = text(statement)

    try:
        async with engine.connect() as conn:
            await conn.execute(statement)
            await conn.commit()
    except SQLAlchemyError as e:
        error=str(e.orig)
        print("Fail to update "+ table + " record: " + error)

async def test_init():
    '''
    Init the database with a test task, if not already present
    '''
    # Dataset
    #statement = text("""INSERT INTO dataset ('id', 'name', 'description', 'image_url') values(:id, :name, :description, :image_url )""")
    dataset_data = { "id": '811b64f1-323f-4a78-bdb8-ebaab44b023a', 
                     "name": "Softcite",
                     "description": "Software mention contexts",
                     "image_url": "images/software.png" }

    await insert_item("dataset", dataset_data)

    #item = await get_item("dataset", "811b64f1-323f-4a78-bdb8-ebaab44b023a")
    #print(item)

    # insert data for the dataset
    from loader import import_dataset_json
    result, nb_documents, nb_excerpts, nb_classifications, nb_labeling = await import_dataset_json(
        "811b64f1-323f-4a78-bdb8-ebaab44b023a", 
        "tests/resources/corpus-false-negative-annotators.classification.json.gz")

    # generate classification tasks from the dataset for 5 users, double annotations
    from kisp.tasks import generate_tasks
    await generate_tasks(dataset_data["id"], task_type="classification", target_annotators=5, redundancy=2, labels=["created", "used", "shared"])

