import contextlib
import asyncio
import uuid
from kish.db import get_async_session, get_user_db, engine
from kish.schemas import UserCreate
from kish.users_manager import get_user_manager
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
                    await create_preferences(str(user.id))
    except UserAlreadyExists:
        print(f"User {email} already exists")

async def create_preferences(user_id: str):
    # default value for preferences
    record = await insert_item("preferences", {"user_id": user_id, "auto_move_on": 1, "dark_mode": 1}, add_id=False)
    return record

async def get_first_item(table, item_dict):
    item = None
    try:
        async with engine.connect() as conn:
            statement = "SELECT * FROM "+table
            if item_dict != None and len(item_dict)>0:
                statement += " WHERE "
                start = True
                #print(item_dict)
                for key in item_dict:
                    if start:
                        start = False
                    else:
                        statement += " AND "
                    if item_dict[key] == None:
                        statement +=  key + " is NULL"
                    else:
                        statement +=  key + " = '" + item_dict[key] + "'"
                    #print(item_dict[key])
            #print(statement)
            statement = text(statement)

            results = await conn.execute(statement)
            item_row = results.first()
            if item_row != None:
                item = row2dict(item_row)
    except SQLAlchemyError as e:
        error=str(e.__dict__['orig'])
        print("Fail to access record in " + table + ": " + error)
    return item

async def get_items(table, item_dict, offset_from=-1, offset_to=-1, full=False):
    items = []
    try:
        async with engine.connect() as conn:
            statement = "SELECT * FROM "+table
            if item_dict != None and len(item_dict)>0:
                statement += " WHERE "
                start = True
                for key in item_dict:
                    if start:
                        start = False
                    else:
                        statement += " AND "
                    if item_dict[key] == None:
                        statement +=  key + " is NULL"
                    else:
                        statement +=  key + " = '" + item_dict[key] + "'"
            if offset_to != -1 and (offset_from == -1 or offset_from == 0):
                statement += " LIMIT " + str(offset_to)
            elif offset_to != -1 and offset_to > offset_from:
                limit = offset_to - offset_from
                statement += " LIMIT " + str(limit)
            if offset_from != -1 and offset_from != 0:
                statement += " OFFSET " + str(offset_from)
            #print(statement)
            statement = text(statement)
            results = await conn.execute(statement)
            item_rows = results.all()
            if len(item_rows) == 0:
                return items
            for item_row in item_rows:
                if full:
                    items.append(row2dict(item_row))
                else:
                    item_row_dict = row2dict(item_row)
                    if "id" in item_row_dict:
                        items.append(item_row["id"])
                    else:
                        items.append(item_row_dict)
    except SQLAlchemyError as e:
        error=str(e.__dict__['orig'])
        print("Fail to access records in " + table + ": " + error)
    return items

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
    #print(statement)
    statement = text(statement)

    try:
        async with engine.connect() as conn:
            await conn.execute(statement, record_as_dict)
            await conn.commit()
    except SQLAlchemyError as e:
        error=str(e.orig)
        print("Fail to insert "+ table + " record: " + error)
        return {"error": error}

    if "id" in record_as_dict:
        return {"id": record_as_dict["id"]}
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
        statement += key + " = '" + str(record_dict[key]) + "'"
    if table == 'preferences':
        statement += " WHERE user_id = '" + record_id + "'";
    else:
        statement += " WHERE id = '" + record_id + "'";
    statement = text(statement)

    try:
        async with engine.connect() as conn:
            await conn.execute(statement)
            await conn.commit()
    except SQLAlchemyError as e:
        error=str(e.orig)
        print("Fail to update "+ table + " record: " + error)
        return {"error": error}

    return {"id": record_id}

async def update_task_assignment_progress(task_id, user_id, record_dict):
    statement = "UPDATE assign SET " 
    start = True
    for key in record_dict:
        if start:
            start = False
        else:
            statement += ", "
        statement += key + " = '" + str(record_dict[key]) + "'"
    statement += " WHERE user_id = '" + user_id + "' AND task_id='"+task_id+"'";
    statement = text(statement)
    try:
        async with engine.connect() as conn:
            await conn.execute(statement)
            await conn.commit()
    except SQLAlchemyError as e:
        error=str(e.orig)
        print("Fail to update assign record: " + error)
        return {"error": error}

    return {}

async def get_assigned_user(task_id):
    statement = text("SELECT assign.user_id, user.email FROM assign, user WHERE assign.task_id = '"+task_id+"' AND user.id == assign.user_id")
    item = None
    try:
        async with engine.connect() as conn:
            results = await conn.execute(statement)
            item_row = results.first()
            if item_row != None:
                item = row2dict(item_row)
    except SQLAlchemyError as e:
        error=str(e.__dict__['orig'])
        print("Fail to access record in assign table: " + error)
    return item

async def get_task_attributes(task_id, user_id):
    '''
    Attributes here for a given task are its number of documents, number of excerpts and number of 
    pre-annotations and user annotations    
    '''
    attributes = {}

    # number of excerpts
    statement = text("SELECT count(*) FROM intask WHERE task_id = '"+task_id+"'")
    try:
        async with engine.connect() as conn:
            result = await conn.execute(statement)
            attributes["nb_excerpts"] = result.scalar()
    except SQLAlchemyError as e:
        error=str(e.__dict__['orig'])
        print("Fail to access record in intask table: " + error)

    # number of documents
    statement = text("SELECT count(DISTINCT excerpt.document_id)" + 
        " FROM intask, excerpt" + 
        " WHERE intask.task_id = '"+task_id+"' AND intask.excerpt_id = excerpt.id")
    try:
        async with engine.connect() as conn:
            result = await conn.execute(statement)
            attributes["nb_documents"] = result.scalar()
    except SQLAlchemyError as e:
        error=str(e.__dict__['orig'])
        print("Fail to access record in intask table: " + error)

    # number of annotations    
    statement = text("SELECT count(DISTINCT annotation.id)" + 
        " FROM annotation" + 
        " WHERE annotation.task_id = '"+task_id+"'")
    try:
        async with engine.connect() as conn:
            result = await conn.execute(statement)
            attributes["nb_annotations"] = result.scalar()
    except SQLAlchemyError as e:
        error=str(e.__dict__['orig'])
        print("Fail to access record in intask table: " + error)

    # number of pre-annotations    
    statement = text("SELECT count(DISTINCT annotation.id)" + 
        " FROM annotation" + 
        " WHERE annotation.task_id = '"+task_id+"'")
    try:
        async with engine.connect() as conn:
            result = await conn.execute(statement)
            attributes["nb_pre_annotations"] = result.scalar()
    except SQLAlchemyError as e:
        error=str(e.__dict__['orig'])
        print("Fail to access record in intask table: " + error)

    # number of completed excerpts in the task
    statement = text("SELECT count(DISTINCT annotation.excerpt_id)" + 
        " FROM annotation" + 
        " WHERE annotation.task_id = '"+task_id+"' AND annotation.user_id = '" + user_id +"'")
    try:
        async with engine.connect() as conn:
            result = await conn.execute(statement)
            attributes["nb_completed_excerpts"] = result.scalar()
    except SQLAlchemyError as e:
        error=str(e.__dict__['orig'])
        print("Fail to access record in intask table: " + error)

    return attributes

async def delete_items(table, record_dict):
    statement = "DELETE FROM " + table + " WHERE " 
    start = True
    for key in record_dict:
        if start:
            start = False
        else:
            statement += " AND "
        statement += key + " = '" + str(record_dict[key]) + "'"
    #print(statement)
    statement = text(statement)
    try:
        async with engine.connect() as conn:
            await conn.execute(statement)
            await conn.commit()
            return
    except SQLAlchemyError as e:
        error=str(e.__dict__['orig'])
        print("Fail to delete record(s) in "+ table + ": " + error)
        return {"error": error}

async def test_init():
    '''
    Init the database with a test task, if not already present
    '''
    # Dataset
    dataset_data = { "id": '811b64f1-323f-4a78-bdb8-ebaab44b023a', 
                     "name": "Softcite",
                     "description": "Software mention contexts",
                     "image_url": "images/software.png" }

    # check if dataset is already present
    dataset = await get_first_item("dataset", {"id": "811b64f1-323f-4a78-bdb8-ebaab44b023a"})
    if dataset is not None:
        return

    await insert_item("dataset", dataset_data)

    # insert data for the dataset
    sofcite_dataset_sources = ["tests/resources/corpus-false-negative-annotators.classification.json.gz", ]

    from loader import import_dataset_json
    result, nb_documents, nb_excerpts, nb_classifications, nb_labeling = await import_dataset_json(
        "811b64f1-323f-4a78-bdb8-ebaab44b023a", 
        sofcite_dataset_sources)

    # generate classification tasks from the dataset for 5 users, double annotations
    from kish.tasks import generate_tasks
    await generate_tasks(dataset_data["id"], task_type="classification", target_annotators=5, redundancy=2, labels=["created", "used", "shared"])
    

    # insert smaller data for dedicated tests
    '''
    from loader import import_dataset_json
    result, nb_documents, nb_excerpts, nb_classifications, nb_labeling = await import_dataset_json(
        "811b64f1-323f-4a78-bdb8-ebaab44b023a", 
        "tests/resources/dummy.classification.json")

    from kish.tasks import generate_tasks
    await generate_tasks(dataset_data["id"], task_type="classification", target_annotators=1, redundancy=2, labels=["created", "used", "shared"])
    '''