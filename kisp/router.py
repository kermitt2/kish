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

@router.get("/users", tags=["users"],
    description="Return the list of available users.")
async def get_users(user: User = Depends(current_superuser)):
    start_time = time.time()
    result = {}
    result['count'] = 1
    #records = []
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
    result['record'] = get_item("task", identifier)
    result['runtime'] = round(time.time() - start_time, 3)
    return result

