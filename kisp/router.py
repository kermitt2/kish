import os 
import binascii
import time 
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

from kisp.users_manager import fastapi_users
from kisp.db import User
current_superuser = fastapi_users.current_user(active=True, superuser=True)
current_user = fastapi_users.current_user(active=True)

@router.get("/users", tags=["users"],
    description="Return the list of available users.")
async def get_users(user: User = Depends(current_superuser)):
    start_time = time.time()
    result = {}
    result['count'] = 1
    from utils_db import get_items
    records = await get_items("user")
    result['records'] = records
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/tasks", tags=["tasks"],
    description="Return the list of available tasks.")
async def get_tasks():
    start_time = time.time()
    result = {}
    result['count'] = 1
    from utils_db import get_items
    records = await get_items("task")
    result['records'] = records
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/tasks/{identifier}", tags=["tasks"], 
    description="Return a task by its id")
async def get_task(identifier: str):
    start_time = time.time()
    result = {}
    from utils_db import get_item
    item = await get_item("task", identifier)
    if item == None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    else:
        # enrich the task item with some additional information
        # dataset name
        dataset_item = await get_item("dataset", item["dataset_id"])
        item["dataset_name"] = dataset_item["name"]

        # possible assigned user 
        from utils_db import get_assigned_user
        local_user = await get_assigned_user(identifier)
        if local_user == None or "user_id" not in local_user:
            item["status"] = "unassigned"
            item["assigned"] = None
        else:
            item["assigned"] = local_user["email"]
            item["status"] = "assigned"

        # number of documents, excerpts and annotations
        from utils_db import get_task_attributes
        task_attributes = await get_task_attributes(identifier)
        if "nb_documents" in task_attributes:
            item["nb_documents"] = task_attributes["nb_documents"]
        if "nb_excerpts" in task_attributes:
            item["nb_excerpts"] = task_attributes["nb_excerpts"]
        if "nb_annotations" in task_attributes:
            item["nb_annotations"] = task_attributes["nb_annotations"]

        result['record'] = item
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/datasets", tags=["datasets"],
    description="Return the list of available datasets.")
async def get_datasets():
    start_time = time.time()
    result = {}
    result['count'] = 1
    from utils_db import get_items
    records = await get_items("dataset")
    result['records'] = records
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.get("/datasets/{identifier}", tags=["datasets"], 
    description="Return a dataset by its id")
async def get_dataset(identifier: str):
    start_time = time.time()
    result = {}
    from utils_db import get_item
    item = await get_item("dataset", identifier)
    if item == None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    else:
        result['record'] = item
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.post("/tasks/{identifier}/assign", tags=["tasks"], 
    description="Assign a task to the current user")
async def post_self_assign_task(identifier: str, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}
    from utils_db import get_item
    item = await get_item("task", identifier)
    if item == None:
        raise HTTPException(status_code=404, detail="Task not found")
    else:
        assign_dict = { "task_id": identifier, "user_id": str(user.id), "in_progress": False, "completed_excerpts": 0 }
        from utils_db import insert_item
        assign_result = await insert_item("assign", assign_dict, add_id=False)
        if assign_result != None and "error" in assign_result:
            raise HTTPException(status_code=500, detail="Assignment failed: "+assign_result["error"])
    result['runtime'] = round(time.time() - start_time, 3)
    return result

@router.post("/tasks/{identifier}/assign/{user_id}", tags=["tasks"], 
    description="Assign a task to a given user")
async def post_assign_task(identifier: str, user_id: str, user: User = Depends(current_user)):
    start_time = time.time()
    result = {}
    from utils_db import get_item
    item = await get_item("task", identifier)
    if item == None:
        raise HTTPException(status_code=404, detail="Task not found")
    user = await get_user("user", user_id)
    if user == None:
        raise HTTPException(status_code=404, detail="User not found")
    assign_dict = {"task_id": identifier, "user_id": user_id }
    from utils_db import insert_item
    await insert_item("assign", assign_dict, add_id=False)

    result['runtime'] = round(time.time() - start_time, 3)
    return result
