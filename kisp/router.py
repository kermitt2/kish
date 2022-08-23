import os 
import binascii
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi import File, Form, UploadFile
from fastapi.responses import PlainTextResponse, RedirectResponse
from fastapi.responses import StreamingResponse
from fastapi.responses import FileResponse
import time 
from enum import Enum

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

