import os 
import binascii
import time 
from kish.utils import deliver_markdown
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi import File, Form, UploadFile
from fastapi.responses import PlainTextResponse, RedirectResponse
from fastapi.responses import StreamingResponse
from fastapi.responses import FileResponse
from enum import Enum
from typing import List

import logging
import logging.handlers
# default logging settings, will be override by config file
logging.basicConfig(filename='server.log', filemode='w', level=logging.DEBUG)

router = APIRouter()

@router.get("/alive", response_class=PlainTextResponse, tags=["generic"], 
    description="Return true if service is up and running.")
def is_alive_status():
    return "true"

@router.get("/version", response_class=PlainTextResponse, tags=["generic"], 
    description="Return the version tag of the service.")
def get_version():
    api_settings = scorer.config['api']
    return api_settings['version']

# to redirect the static root to app/index.html
@router.get("/", response_class=RedirectResponse, include_in_schema=False)
def static_root1_():
    return RedirectResponse(url="app/index.html")

# to redirect the static root app/ to app/index.html
@router.get("/app", response_class=RedirectResponse, include_in_schema=False)
def static_root2_():
    return RedirectResponse(url="app/index.html")

from kish.users_manager import fastapi_users
from kish.db import User
current_superuser = fastapi_users.current_user(active=True, superuser=True)
current_user = fastapi_users.current_user(active=True)

@router.get("/users", tags=["users"],
    description="Return the list of available users.")
async def get_users(user: User = Depends(current_superuser)):
    start_time = time.time()
    result = {}
    from utils_db import get_items
    records = await get_items("user", {})
    result['count'] = 1
    result['records'] = records
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/users/preferences", tags=["users"],
    description="Return the preferences of the current user.")
async def get_user_preferences(user: User = Depends(current_user)):
    start_time = time.time()
    result = {}
    from utils_db import get_first_item
    record = await get_first_item("preferences", { "user_id": str(user.id) })

    if record == None:
        # no preference for the user, we add some default one and return it
        from utils_db import create_preferences
        await create_preferences(str(user.id))
        record = await get_first_item("preferences", { "user_id": str(user.id) })

    result['count'] = 1
    result['record'] = record
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.put("/users/preferences", tags=["users"],
    description="Update the preferences of the current user.")
async def put_user_preferences(request: Request, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}
    preferences_dict = await request.json()
    from utils_db import update_record
    record = await update_record("preferences", str(user.id), preferences_dict)
    result['record'] = record
    result['runtime'] = round(time.time() - start_time, 3)
    return result    

@router.get("/tasks", tags=["tasks"],
    description="Return the list of available tasks.")
async def get_tasks():
    start_time = time.time()
    result = {}
    result['count'] = 1
    from utils_db import get_items
    records = await get_items("task", {})
    result['records'] = records
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/datasets/{identifier}/metrics", tags=["datasets"],
    description="Return advancement and IAA metrics for the tasks of a given dataset.")
async def get_dataset_metrics(identifier: str, type: str):
    start_time = time.time()
    result = {}

    print(identifier, type)

    from metrics import compute_overall_metrics
    metrics_dict = await compute_overall_metrics(identifier, type)
    print(metrics_dict)

    result["metrics"] = metrics_dict

    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/tasks/dataset/export", tags=["tasks"],
    description="Return the resulting JSON export file for the tasks in a given dataset and a type of tasks.")
async def export_dataset(identifier: str, type: str):
    start_time = time.time()
    result = {}


    result['runtime'] = round(time.time() - start_time, 3)
    return result




@router.get("/tasks/dataset/{identifier}", tags=["tasks"],
    description="Return the list of tasks for a given dataset.")
async def get_dataset_tasks(identifier: str):
    start_time = time.time()
    result = {}
    result['count'] = 1
    from utils_db import get_items
    records = await get_items("task", { "dataset_id": identifier}, full=True)

    # custom functions to get task name info
    def get_name(record):
        return record.get("name")

    records.sort(key=get_name)
    final_records = [record["id"] for record in records]

    result['records'] = final_records
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/tasks/user", tags=["tasks"],
    description="Return the list of tasks assigned to the current user.")
async def get_current_user_tasks(user: User = Depends(current_user)):
    start_time = time.time()
    result = {}
    result['count'] = 1
    from utils_db import get_items
    records = await get_items("assign", { "user_id": str(user.id)}, full=True)
    result['records'] = records
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/tasks/user/{identifier}", tags=["tasks"],
    description="Return the list of tasks assigned to an arbitrary given user (require to be superuser).")
async def get_user_tasks(identifier: str, user: User = Depends(current_superuser)):
    start_time = time.time()
    result = {}
    result['count'] = 1
    from utils_db import get_items
    records = await get_items("task", { "user_id": str(user.id)}, full=True)
    result['records'] = records
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/tasks/{identifier}", tags=["tasks"], 
    description="Return a task by its identifier")
async def get_task(identifier: str, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}
    from utils_db import get_first_item
    item = await get_first_item("task", {"id": identifier})
    if item == None:
        raise HTTPException(status_code=404, detail="Task not found")
    else:
        # enrich the task item with some additional information
        # dataset name
        dataset_item = await get_first_item("dataset", {"id": item["dataset_id"]})
        item["dataset_name"] = dataset_item["name"]

        # possible assigned user 
        from utils_db import get_assigned_user
        local_user = await get_assigned_user(identifier)
        if local_user == None or "user_id" not in local_user:
            item["status"] = "unassigned"
            item["assigned"] = None
        else:
            item["assigned"] = local_user["email"]
            assign_item = await get_first_item("assign", {"task_id": identifier, "user_id": local_user["user_id"]})
            if assign_item["is_completed"]:
                item["status"] = "completed"
                item["is_completed"] = 1
            else: 
                item["status"] = "assigned"
                item["is_completed"] = 0

        # number of documents, excerpts and annotations
        from utils_db import get_task_attributes
        task_attributes = await get_task_attributes(item)
        for key in task_attributes:
            item[key] = task_attributes[key]
        """    
        if "nb_documents" in task_attributes:
            item["nb_documents"] = task_attributes["nb_documents"]
        if "nb_excerpts" in task_attributes:
            item["nb_excerpts"] = task_attributes["nb_excerpts"]
        if "nb_annotations" in task_attributes:
            item["nb_annotations"] = task_attributes["nb_annotations"]
        if "nb_pre_annotations" in task_attributes:
            item["nb_pre_annotations"] = task_attributes["nb_pre_annotations"]
        if "nb_completed_excerpts" in task_attributes:
            item["nb_completed_excerpts"] = task_attributes["nb_completed_excerpts"]
        if "subtype" in task_attributes:
            item["subtype"] = task_attributes["subtype"]
        """
        result['record'] = item
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/tasks/{identifier}/excerpts", tags=["tasks"], 
    description="Return all excerpt identifiers from the given task.")
async def get_task_excerpts(identifier: str):
    start_time = time.time()
    result = {}

    from utils_db import get_items
    items = await get_items("intask", { "task_id": identifier }, full=True)
    if items == None or len(items)==0:
        result["records"] = {}
        #raise HTTPException(status_code=404, detail="Excerpt not found")
    else:
        records = []
        for item in items:
            if "excerpt_id" in item:
                records.append(item["excerpt_id"])
        all_records = {}
        all_records["excerpts"] = records

        i = 0
        for item in items:
            local_annotation_dict = { "task_id": identifier, "excerpt_id": item["excerpt_id"], }
            local_annotations = await get_items("annotation", local_annotation_dict, full=True)
            excerptDone = False

            if local_annotations == None or len(local_annotations) == 0:
                all_records["first_non_complete"] = i
                break
            else:
                for local_annotation in local_annotations:
                    if "user_id" in local_annotation and local_annotation["user_id"] != None:
                        excerptDone = True
                        break
                if not excerptDone:
                    all_records["first_non_complete"] = i
                    break
            i += 1

        result["records"] = all_records

    result['runtime'] = round(time.time() - start_time, 3)
    return result   

@router.get("/tasks/{identifier}/documents", tags=["tasks"], 
    description="Return all documents identifiers from the given task.")
async def get_task_documents(identifier: str):
    start_time = time.time()
    result = {}

    from utils_db import get_items
    items = await get_items("intask", { "task_id": identifier }, full=True)
    if items == None or len(items)==0:
        result["records"] = {}
        #raise HTTPException(status_code=404, detail="Excerpt not found")
    else:
        records = []
        for item in items:
            if "document_id" in item and ("excerpt_id" not in item or item["excerpt_id"] is None) and item["document_id"] not in records:
                records.append(item["document_id"])
        all_records = {}
        all_records["documents"] = records

        i = 0
        for item in items:
            if "document_id" in item and ("excerpt_id" not in item or item["excerpt_id"] is None):
                if item["validated"] == 0 and item["ignored"] == 0:
                    we_have_match = True
                    try:
                        all_records["first_non_complete"] = records.index(item["document_id"])
                    except: 
                        # this should not happen
                        we_have_match = False
                    if we_have_match:
                        break
            i += 1

        result["records"] = all_records

    result['runtime'] = round(time.time() - start_time, 3)
    return result   

@router.get("/tasks/{identifier}/excerpt", tags=["tasks"], 
    description="Return an excerpt from the given task.")
async def get_task_excerpt(identifier: str, rank: int = None):
    '''
    To get an excerpt to be annotated or already annotated in task, parameter
    are its rank (in the task list of excerpts) or a jump method which can be:
    - "first": first in the task list (same as rank=0)
    - "last": last in the task list 
    '''
    start_time = time.time()
    result = {}
    intask_dict = { "task_id": identifier }

    if rank == -1 or rank == None:
        offset_from = 0
        offset_to = 1
    else: 
        offset_from = rank
        offset_to = rank+1

    from utils_db import get_items
    items = await get_items("intask", intask_dict, offset_from, offset_to, full=True)
    if items == None or len(items)==0:
        raise HTTPException(status_code=404, detail="Excerpt not found")
    else:
        # enrich the task item with some additional information
        item = items[0]
        from utils_db import get_first_item
        excerpt_item = await get_first_item("excerpt", {"id": item["excerpt_id"]})
        if excerpt_item == None:
            raise HTTPException(status_code=404, detail="Excerpt not found")
        else:
            excerpt_item["validated"] = item["validated"]
            excerpt_item["ignored"] = item["ignored"]
            excerpt_item["task_id"] = item["task_id"]
            result['record'] = excerpt_item
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/tasks/{identifier}/document", tags=["tasks"], 
    description="Return a document from the given task.")
async def get_task_document(identifier: str, rank: int = None):
    '''
    To get a document to be annotated or already annotated in task, parameter
    are its rank (in the task list of documents) or a jump method which can be:
    - "first": first in the task list (same as rank=0)
    - "last": last in the task list 

    Return response include the ""status" of the document in the task, e.g 
    validated or not.
    '''
    start_time = time.time()
    result = {}
    intask_dict = { "task_id": identifier }

    if rank == -1 or rank == None:
        offset_from = 0
    else: 
        offset_from = rank

    from utils_db import get_items
    items = await get_items("intask", intask_dict, full=True)
    if items == None or len(items)==0:
        raise HTTPException(status_code=404, detail="Document not found")
    else:
        # get the documents
        local_documents = []
        for item in items:
            if "document_id" in item and item["document_id"] not in local_documents:
                local_documents.append(item["document_id"])

        if offset_from>=len(local_documents):
            # inconsistent rank beyond the number of documents in the task, but we can default with the last one
            item_id = local_documents[-1]
        else:
            item_id = local_documents[offset_from]

        # enrich the task item with some additional information
        from utils_db import get_first_item
        document_item = await get_first_item("document", {"id": item_id})
        if document_item == None:
            raise HTTPException(status_code=404, detail="Document not found")

        intask_item = await get_first_item("intask", {"document_id": item_id, "task_id": identifier, "excerpt_id": None})
        if intask_item != None:
            document_item["validated"] = intask_item["validated"]
            document_item["ignored"] = intask_item["ignored"]

        result['record'] = document_item
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/tasks/{identifier_task}/document/{identifier_doc}/excerpts", tags=["tasks"], 
    description="Return all the excerpts for a document from the given task.")
async def get_task_document_excerpts(identifier_task: str, identifier_doc: str):
    '''
    To get all the excerpts of a document to be annotated or already annotated in a 
    given task. The full record of the excerpts are returned. 
    '''
    start_time = time.time()
    result = {}
    records = []
    intask_dict = { "task_id": identifier_task, "document_id": identifier_doc }

    from utils_db import get_items, get_first_item
    items = await get_items("intask", intask_dict, full=True)
    if items == None or len(items)==0:
        raise HTTPException(status_code=404, detail="No excerpt found")
    else:
        # get the excerpt objects now
        for item in items:
            if "excerpt_id" not in item or item["excerpt_id"] is None:
                continue

            excerpt_item = await get_first_item("excerpt", {"id": item["excerpt_id"] })
            if excerpt_item == None:
                continue

            excerpt_item["validated"] = item["validated"]
            excerpt_item["ignored"] = item["ignored"]
            records.append(excerpt_item)

        result['records'] = records
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/tasks/{identifier}/guidelines", tags=["tasks"], 
    description="Return the guidelines associated to the given task.")
async def get_task_guidelines(identifier: str):
    start_time = time.time()
    result = {}
    task_dict = { "id": identifier }

    from utils_db import get_first_item
    item = await get_first_item("task", task_dict)
    if item == None:
        raise HTTPException(status_code=404, detail="Guidelines not found")
    else:
        record = {}
        result["record"] = deliver_markdown(item["guidelines"])

    result['runtime'] = round(time.time() - start_time, 3)
    return result   

@router.get("/datasets", tags=["datasets"],
    description="Return the list of available datasets.")
async def get_datasets():
    start_time = time.time()
    result = {}
    result['count'] = 1
    from utils_db import get_items
    records = await get_items("dataset", {})
    result['records'] = records
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/datasets/{identifier}", tags=["datasets"], 
    description="Return a dataset by its id.")
async def get_dataset(identifier: str):
    start_time = time.time()
    result = {}
    from utils_db import get_first_item
    item = await get_first_item("dataset", {"id": identifier})
    if item == None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    else:
        result['record'] = item
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/datasets/{identifier}/labels", tags=["datasets"], 
    description="Return the labels used in the dataset for a task type.")
async def get_dataset_labels(identifier: str, type: str = None):
    start_time = time.time()
    result = {}
    from utils_db import get_items
    if type == None or len(type) == 0:
        items = await get_items("label", {"dataset_id": identifier}, full=True)
    else:
        items = await get_items("label", {"dataset_id": identifier, "type": type}, full=True)
    if items == None or len(items)==0:
        raise HTTPException(status_code=404, detail="Labels not found")
    else:
        result['records'] = items
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.post("/datasets/{identifier}/label", tags=["datasets"], 
    description="Add or update, if already present, a label used in the dataset for a task type.")
async def add_dataset_labels(identifier: str, request: Request, type: str = None, user: User = Depends(current_user)):
    start_time = time.time()
    
    label_dict = await request.json()

    result = {}
    from utils_db import get_first_item
    # label already present?
    if type == None or len(type) == 0:
        item = await get_first_item("label", {"dataset_id": identifier, "name": label_dict["name"]})
    else:
        item = await get_first_item("label", {"dataset_id": identifier, "type": type, "name": label_dict["name"]})

    if item == None:
        # not present, we add the label and return its full structure with generated id
        from utils_db import insert_item
        record = await insert_item("label", label_dict, add_id=True)
        result['record'] = record
    else:
        # label is already defined, we update the fields
        for field in label_dict:
            if field == 'id': 
                continue
            if field in label_dict and len(label_dict[field])>0:
                item[field] = label_dict[field]
        from utils_db import update_record
        record = await update_record("label", str(item.id), item)
        result['record'] = record

    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/documents/{identifier}", tags=["datasets"], 
    description="Return information about a document.")
async def get_document_metadata(identifier: str):
    start_time = time.time()
    result = {}
    from utils_db import get_first_item
    item = await get_first_item("document", {"id": identifier})
    if item == None:
        raise HTTPException(status_code=404, detail="Document not found")
    else:
        result['record'] = item
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/documents/{identifier}/pdf", tags=["datasets"], 
    description="Return the PDF of a document, if available on server.")
async def get_document_metadata(identifier: str):
    
    from utils_db import get_first_item
    item = await get_first_item("document", {"id": identifier})
    if item == None:
        raise HTTPException(status_code=404, detail="Document not found")

    # get and check TEI path
    pdf_file_path = item["pdf_uri"]
    if pdf_file_path == None or len(pdf_file_path) == 0 or not os.path.isfile(pdf_file_path):
        raise HTTPException(status_code=404, detail="PDF file not valid")
    
    return FileResponse(pdf_file_path)

@router.get("/documents/{identifier}/tei", tags=["datasets"], 
    description="Return the TEI XML of a document, if available on server.")
async def get_document_metadata(identifier: str):

    from utils_db import get_first_item
    item = await get_first_item("document", {"id": identifier})
    if item == None:
        raise HTTPException(status_code=404, detail="Document not found")

    # get and check TEI path
    tei_file_path = item["tei_uri"]
    if tei_file_path == None or len(tei_file_path) == 0 or not os.path.isfile(tei_file_path):
        raise HTTPException(status_code=404, detail="TEI XML file not valid")

    return FileResponse(tei_file_path)

@router.get("/tasks/redundant/me", tags=["tasks"], 
    description="Return the list of redundant tasks that can not be assigned to the current user.")
async def get_redundant_tasks_current_user(user: User = Depends(current_user)):
    start_time = time.time()
    result = {}
    records = []

    # get the tasks assigned to the user
    from utils_db import get_items
    assign_dict = { "user_id": str(user.id) }
    items = await get_items("assign", assign_dict, full=True)

    if items == None or len(items) == 0:
        result['runtime'] = round(time.time() - start_time, 3)
        result["records"] = records
        return result

    # get the redundant tasks
    for item in items:
        from utils_db import get_first_item
        local_task = await get_first_item("task", { "id": item["task_id"] })
        if local_task["redundant"] != None:
            # it is a "secondary" task, get the primary task (given in this case by the field "redundant") 
            # and the other secondary tasks
            records.append(local_task["redundant"])
            # get other redundant tasks
            redundant_tasks = await get_items("task", { "redundant": local_task["redundant"] })
            for redundant_task in redundant_tasks:
                if redundant_task not in records and redundant_task != item["task_id"]:
                    records.append(redundant_task)
        else:
            # it is a "primary" task, get its redundant tasks
            redundant_tasks = await get_items("task", { "redundant": local_task["id"] })
            for redundant_task in redundant_tasks:
                if redundant_task not in records:
                    records.append(redundant_task)

    result['runtime'] = round(time.time() - start_time, 3)
    result["records"] = records
    return result        

@router.get("/tasks/redundant/{user_id}", tags=["tasks"], 
    description="Return the list of redundant tasks that can not be assigned to an arbitrary user (require to be superuser).")
async def get_redundant_tasks(user_id: str, user: User = Depends(current_superuser)):
    start_time = time.time()
    result = {}
    records = []

    # get the tasks assigned to the user
    from utils_db import get_items
    assign_dict = { "user_id": user_id }
    items = await get_items("assign", assign_dict, full=True)

    if items == None or len(items) == 0:
        result['runtime'] = round(time.time() - start_time, 3)
        result["records"] = records
        return result

    # get the redundant tasks
    for item in items:
        from utils_db import get_first_item
        local_task = await get_first_item("task", { "id": item["task_id"] })
        if local_task["redundant"] != None:
            # it is a "secondary" task, get the primary task (given in this case by the field "redundant") 
            # and the other secondary tasks
            records.append(local_task["redundant"])
            # get other redundant tasks
            redundant_tasks = await get_items("task", { "redundant": local_task["redundant"] })
            for redundant_task in redundant_tasks:
                if redundant_task not in records and redundant_task != item["task_id"]:
                    records.append(redundant_task)
        else:
            # it is a "primary" task, get its redundant tasks
            redundant_tasks = await get_items("task", { "redundant": local_task["id"] })
            for redundant_task in redundant_tasks:
                if redundant_task not in records:
                    records.append(redundant_task)

    result['runtime'] = round(time.time() - start_time, 3)
    result["records"] = records
    return result

@router.post("/tasks/{identifier}/assign", tags=["tasks"], 
    description="Assign a task to the current user.")
async def post_self_assign_task(identifier: str, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}
    from utils_db import get_first_item
    item = await get_first_item("task", { "id": identifier} )
    if item == None:
        raise HTTPException(status_code=400, detail="Task not found")
    else:
        assign_dict = { "task_id": identifier, "user_id": str(user.id), "in_progress": 0, "is_completed": 0, "completed_excerpts": 0 }
        from utils_db import insert_item
        assign_result = await insert_item("assign", assign_dict, add_id=False)
        if assign_result != None and "error" in assign_result:
            raise HTTPException(status_code=500, detail="Assignment failed: "+assign_result["error"])
        # return the list of redundant tasks for the assigned one
        records = []
        from utils_db import get_items
        if item["redundant"] != None:
            # it is a "secondary" task, get the primary task (given in this case by the field "redundant") 
            # and the other secondary tasks
            records.append(item["redundant"])
            # get other redundant tasks
            redundant_tasks = await get_items("task", { "redundant": item["redundant"] })
            for redundant_task in redundant_tasks:
                if redundant_task not in records and redundant_task != identifier:
                    records.append(redundant_task)
        else:
            # it is a "primary" task, get its redundant tasks
            redundant_tasks = await get_items("task", { "redundant": item["id"] })
            for redundant_task in redundant_tasks:
                if redundant_task not in records:
                    records.append(redundant_task)
        result["records"] = records
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.put("/tasks/{identifier}/assign", tags=["tasks"], 
    description="Update progress of a task assigned to the current user.")
async def put_update_assigned_task(identifier: str, request: Request, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}

    task_assign_dict = await request.json()

    # some validation here...
    #print(task_assign_dict)

    from utils_db import update_task_assignment_progress
    update_result = await update_task_assignment_progress(identifier, str(user.id), task_assign_dict)
    if update_result != None and "error" in update_result:
        raise HTTPException(status_code=500, detail="Task assigment progress update failed: "+update_result["error"])

    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.post("/tasks/{identifier}/reconciliation", tags=["tasks"], 
    description="Open a reconciliation task if all the redundant tasks for the given task are completed.")
async def post_reconciliation_task(identifier: str):
    start_time = time.time()
    result = {}
    is_open = False

    # if task is complete, check completeness of all redundant tasks
    from tasks import check_completed_tasks, open_reconciliation_task, has_reconciliation_task
    already_reconciliation = await has_reconciliation_task(identifier)
    if not already_reconciliation:
        allComplete = await check_completed_tasks(identifier)
        if allComplete:
            is_open = await open_reconciliation_task(identifier)

    result['reconciliation_open'] = is_open

    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.post("/tasks/{identifier}/assign/{user_id}", tags=["tasks"], 
    description="Assign a task to an arbitrary given user (require to be superuser.")
async def post_assign_task(identifier: str, user_id: str, user: User = Depends(current_superuser)):
    start_time = time.time()
    result = {}
    from utils_db import get_first_item
    item = await get_first_item("task", {"id": identifier})
    if item == None:
        raise HTTPException(status_code=400, detail="Task not found")
    user = await get_user("user", user_id)
    if user == None:
        raise HTTPException(status_code=400, detail="User not found")
    assign_dict = {"task_id": identifier, "user_id": user_id, "in_progress": False, "is_completed":False, "completed_excerpts": 0  }
    from utils_db import insert_item
    assign_result = await insert_item("assign", assign_dict, add_id=False)
    if assign_result != None and "error" in assign_result:
        raise HTTPException(status_code=400, detail="Assignment failed: "+assign_result["error"])
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.delete("/tasks/{identifier}/assign", tags=["tasks"], 
    description="Unassign a task from the current user.")
async def delete_self_assign_task(identifier: str, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}
    from utils_db import get_first_item
    item = await get_first_item("task", {"id": identifier})
    if item == None:
        raise HTTPException(status_code=400, detail="Task not found")
    else:
        assign_dict = { "task_id": identifier, "user_id": str(user.id) }
        from utils_db import delete_items
        assign_result = await delete_items("assign", assign_dict)
        if assign_result != None and "error" in assign_result:
            raise HTTPException(status_code=500, detail="Unassignment failed: "+assign_result["error"])
        # return the list of redundant tasks for the unassigned one
        records = []
        from utils_db import get_items
        if item["redundant"] != None:
            # it is a "secondary" task, get the primary task (given in this case by the field "redundant") 
            # and the other secondary tasks
            records.append(item["redundant"])
            # get other redundant tasks
            redundant_tasks = await get_items("task", { "redundant": item["redundant"] })
            for redundant_task in redundant_tasks:
                if redundant_task not in records and redundant_task != identifier:
                    records.append(redundant_task)
        else:
            # it is a "primary" task, get its redundant tasks
            redundant_tasks = await get_items("task", { "redundant": item["id"] })
            for redundant_task in redundant_tasks:
                if redundant_task not in records:
                    records.append(redundant_task)
        result["records"] = records

    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.delete("/tasks/{identifier}/assign/{user_id}", tags=["tasks"], 
    description="Unassign a task from a given user.")
async def delete_assign_task(identifier: str, user_id: str, user: User = Depends(current_superuser)):
    start_time = time.time()
    result = {}
    from utils_db import get_first_item
    item = await get_first_item("task", {"id": identifier})
    if item == None:
        raise HTTPException(status_code=400, detail="Task not found")
    user = await get_user("user", user_id)
    if user == None:
        raise HTTPException(status_code=400, detail="User not found")
    assign_dict = {"task_id": identifier, "user_id": user_id }
    from utils_db import delete_items
    assign_result = await delete_items("assign", assign_dict)
    if assign_result != None and "error" in assign_result:
        raise HTTPException(status_code=500, detail="Unassignment failed: "+assign_result["error"])
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/annotations/{identifier}", tags=["annotations"], 
    description="Return an annotation by its id.")
async def get_annotation(identifier: str):
    start_time = time.time()
    result = {}
    from utils_db import get_first_item
    item = await get_first_item("annotation", {"id": identifier})
    if item == None:
        raise HTTPException(status_code=404, detail="Annotation not found")
    else:
        result['record'] = item
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/annotations/excerpt/{identifier}", tags=["annotations"], 
    description="Return the annotations for a given excerpt, restricted to pre-annotations and current user annotations.")
async def get_excerpt_annotation(identifier: str, type: str, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}
    from utils_db import get_items

    if user.role == "annotator":
        items1 = await get_items("annotation", {"excerpt_id": identifier, "type": type, "user_id": str(user.id)}, full=True)
        items2 = await get_items("annotation", {"excerpt_id": identifier, "type": type, "user_id": None}, full=True)
        if items1 == None and items2 == None:
            raise HTTPException(status_code=404, detail="Annotation not found")
        else:
            items = items1+items2
    else:
        items = await get_items("annotation", {"excerpt_id": identifier, "type": type}, full=True)

    result['records'] = items
    result['runtime'] = round(time.time() - start_time, 3)
    return result


@router.put("/tasks/{identifier}/excerpt", tags=["annotations"], 
    description="Create or update an excerpt from a document for a given task.")
async def add_excerpt(identifier: str, request: Request, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}

    excerpt_dict = await request.json()

    # if excerpt id already present, it is an update
    existing_excerpt = None
    update = False
    if "excerpt_id" in excerpt_dict:
        from utils_db import get_first_item
        existing_excerpt = await get_first_item("excerpt", { "id": excerpt_dict["excerpt_id"] } )

    # create excerpt record
    if existing_excerpt is not None:
        excerpt_record = existing_excerpt
        update = True
    else:
        excerpt_record = {}
    if "excerpt_id" in excerpt_dict:
        excerpt_record["id"] = excerpt_dict["excerpt_id"]
    if "text" in excerpt_dict:
        excerpt_record["text"] = excerpt_dict["text"]
        excerpt_record["full_context"] = excerpt_dict["text"]
    if "full_context" in excerpt_dict:
        excerpt_record["full_context"] = excerpt_dict["full_context"]
    if "document_id" in excerpt_dict:
        excerpt_record["document_id"] = excerpt_dict["document_id"]
    if "dataset_id" in excerpt_dict:
        excerpt_record["dataset_id"] = excerpt_dict["dataset_id"]

    excerpt_record["offset_start"] = 0
    excerpt_record["offset_end"] = 0

    if update:
        from utils_db import update_record
        excerpt_result = await update_record("excerpt", excerpt_record["id"], excerpt_record, full=True)
    else:
        from utils_db import insert_item
        if "id" in excerpt_record:
            excerpt_result = await insert_item("excerpt", excerpt_record, add_id=False)
        else:
            excerpt_result = await insert_item("excerpt", excerpt_record, add_id=True)

    print("excerpt_result")
    print(excerpt_result)

    # add or update excerpt to the task
    intask_record = {}
    intask_record["excerpt_id"] = excerpt_result["id"]
    intask_record["document_id"] = excerpt_record["document_id"]
    intask_record["task_id"] = identifier
    intask_record["validated"] = False
    intask_record["ignored"] = False
    from utils_db import insert_item
    await insert_item("intask", intask_record, add_id=False)

    result['record'] = excerpt_result
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.put("/annotations/annotation", tags=["annotations"], 
    description="Add or update an annotation.")
async def add_annotation(request: Request, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}

    annotation_dict = await request.json()

    # some validation here...
    annotation_dict["user_id"] = str(user.id)
    #print("annotation to be added/updated:", annotation_dict)

    print(annotation_dict)

    # check if an annotation exists for this user, excerpt and task
    from utils_db import get_first_item

    dict_annot = {"user_id": annotation_dict["user_id"], "task_id": annotation_dict["task_id"], "excerpt_id": annotation_dict["excerpt_id"]}
    if "label_id" in annotation_dict:
        dict_annot["label_id"] = annotation_dict["label_id"]
    if "ignored" in annotation_dict:
        dict_annot["ignored"] = annotation_dict["ignored"]
    item = await get_first_item("annotation", dict_annot)
    if item == None:
        # we insert the new annotation
        from utils_db import insert_item
        annotation_result = await insert_item("annotation", annotation_dict, add_id=True)
        if annotation_result != None and "error" in annotation_result:
            raise HTTPException(status_code=500, detail="Annotation insert failed: "+annotation_result["error"])
        # keep track of progress at the task record
            
    else:
        # we update the existing annotation
        from utils_db import update_record
        annotation_result = await update_record("annotation", item["id"], annotation_dict)
        if annotation_result != None and "error" in annotation_result:
            raise HTTPException(status_code=500, detail="Annotation update failed: "+annotation_result["error"])

    if annotation_result != None and "id" in annotation_result:
        result["record"] = annotation_result["id"]
    else:
        result["record"] = None

    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.delete("/tasks/{identifier}/excerpt/annotations", tags=["annotations"], 
    description="Remove all the current annotations for an excerpt in a given task.")
async def remove_annotations(identifier: str, request: Request, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}

    annotations_dict = await request.json()

    # delete annotations for the specified task and excerpt
    from utils_db import delete_items
    delete_result = await delete_items("annotation", {"excerpt_id": annotations_dict["excerpt_id"], "user_id": str(user.id), "task_id": identifier} )
    if delete_result != None and "error" in delete_result:
        raise HTTPException(status_code=500, detail="Annotation deletion failed: "+delete_result["error"])
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.delete("/tasks/{identifier}/excerpt", tags=["annotations"], 
    description="Remove an excerpt from a given task and all its current annotations.")
async def remove_task_excerpt(identifier: str, request: Request, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}

    annotations_dict = await request.json()
    identifier_excerpt = annotations_dict["excerpt_id"]

    # delete annotations for the specified task and excerpt
    from utils_db import delete_items
    delete_result = await delete_items("annotation", {"excerpt_id": identifier_excerpt, "user_id": str(user.id), "task_id": identifier} )
    if delete_result != None and "error" in delete_result:
        raise HTTPException(status_code=500, detail="Annotation deletion failed: "+delete_result["error"])

    # then intask except
    delete_result = await delete_items("intask", {"excerpt_id": identifier_excerpt, "task_id": identifier} )
    if delete_result != None and "error" in delete_result:
        raise HTTPException(status_code=500, detail="Task excerpt deletion failed: "+delete_result["error"])

    # finally delete excerpt **if not in any other task** (this contraint is important !)
    from utils_db import get_first_item
    dict_annot = { "excerpt_id": identifier_excerpt }
    item = await get_first_item("intask", dict_annot)
    if item == None:
        # no other task with this precise excerpt, so we can remove it entirely
        delete_result = await delete_items("excerpt", {"id": identifier_excerpt} )
        if delete_result != None and "error" in delete_result:
            raise HTTPException(status_code=500, detail="Excerpt deletion failed: "+delete_result["error"])

    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.put("/tasks/{identifier}/document/validate", tags=["annotations"], 
    description="Set a document as validated in a given task.")
async def validate_document(identifier: str, request: Request, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}

    document_dict = await request.json()

    if not "document_id" in document_dict:
        raise HTTPException(status_code=500, detail="Document validation failed: missing document_id parameter")
    document_id = document_dict["document_id"]

    from utils_db import validate_document
    update_result = await validate_document(document_id, identifier)

    if update_result != None and "error" in update_result:
        raise HTTPException(status_code=500, detail="Document validation failed: "+update_result["error"])

    result["record"] = "success"
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.put("/tasks/{identifier}/document/ignore", tags=["annotations"], 
    description="Set a document as ignored in a given task.")
async def ignore_document(identifier: str, request: Request, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}

    document_dict = await request.json()

    if not "document_id" in document_dict:
        raise HTTPException(status_code=500, detail="Document status to ignored failed: missing document_id parameter")
    document_id = document_dict["document_id"]

    from utils_db import ignore_document
    update_result = await ignore_document(document_id, identifier)

    if update_result != None and "error" in update_result:
        raise HTTPException(status_code=500, detail="Document status to ignored failed: "+update_result["error"])

    result["record"] = "success"
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.put("/tasks/{identifier_task}/excerpt/{identifier_excerpt}/validate", tags=["annotations"], 
    description="Set an excerpt as validated in a given task.")
async def validate_task_excerpt(identifier_task: str, identifier_excerpt: str, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}

    from utils_db import validate_excerpt
    update_result = await validate_excerpt(identifier_excerpt, identifier_task)

    if update_result != None and "error" in update_result:
        raise HTTPException(status_code=500, detail="Excerpt validation failed: "+update_result["error"])

    result["record"] = "success"
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.put("/tasks/{identifier_task}/excerpt/{identifier_excerpt}/ignore", tags=["annotations"], 
    description="Set an excerpt as ignored in a given task.")
async def ignore_task_excerpt(identifier_task: str, identifier_excerpt: str, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}

    from utils_db import ignore_excerpt
    update_result = await ignore_excerpt(identifier_excerpt, identifier_task)

    if update_result != None and "error" in update_result:
        raise HTTPException(status_code=500, detail="Excerpt status to ignore failed: "+update_result["error"])

    result["record"] = "success"
    result['runtime'] = round(time.time() - start_time, 3)
    return result
