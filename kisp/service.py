import sys
import os
import uvicorn
from typing import Optional
from fastapi import FastAPI, Response
from pydantic import BaseModel
from pydantic import BaseSettings
import pyfiglet
from functools import lru_cache
import yaml
import argparse
from pathlib import Path
from router import router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles

# for managing users and authentication
from kisp.db_users import User, create_db_and_tables
from kisp.schemas import UserCreate, UserRead, UserUpdate
from kisp.utils import _load_config

'''
    The web API uses the FastAPI framework. 
'''

tags_metadata = [
    {
        "name": "generic",
        "description": "general information on the web service"
    },
    {
        "name": "data",
        "description": "CRUD for annotation data"
    }
]

'''
    Note: managing config is a bit complicated because FastAPI supports a configuration via
    environment variable, so to allow more complex and structured configuration, we extract 
    the API-specific setting parameters from the config file. 
'''

def get_app(server_config) -> FastAPI:
    # the setting specific to the API service (normally one different for dev, test and prod)

    server = FastAPI(
        title=server_config['name'], 
        description=server_config['description'], 
        version=server_config['version'],
        openapi_tags=tags_metadata)
    #server.include_router(router, prefix=server_config['api_route'])
    server.include_router(router)

    server.include_router(
        fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt", tags=["auth"]
    )
    server.include_router(
        fastapi_users.get_register_router(UserRead, UserCreate),
        prefix="/auth",
        tags=["auth"],
    )
    server.include_router(
        fastapi_users.get_reset_password_router(),
        prefix="/auth",
        tags=["auth"],
    )
    server.include_router(
        fastapi_users.get_verify_router(UserRead),
        prefix="/auth",
        tags=["auth"],
    )
    server.include_router(
        fastapi_users.get_users_router(UserRead, UserUpdate),
        prefix="/users",
        tags=["users"],
    )

    origins = ["*"]

    server.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # in case we want to mount directly accessible files
    server.mount("/app", StaticFiles(directory="resources/static"), name="static")

    @server.on_event("startup")
    async def startup_message() -> None:
        ascii_banner = pyfiglet.figlet_format("KISP")
        print(ascii_banner)
        await create_db_and_tables()

    @server.on_event("shutdown")
    async def shutdown() -> None:
        print("KISP service stopped")

    @server.exception_handler(Exception)
    async def validation_exception_handler(request, exc):
        print(str(exc))
        return PlainTextResponse("Something went wrong", status_code=400)

    return server

def load_server_config(config_path):
    """
    yaml_settings = dict()

    yaml_config_file = os.path.abspath(config_path)
    with open(yaml_config_file) as f:
        yaml_settings.update(yaml.load(f, Loader=yaml.FullLoader))
    """

    yaml_settings = _load_config(config_file=config_path)
    return yaml_settings['api']

if __name__ == '__main__':
    # stand alone mode, run the application
    parser = argparse.ArgumentParser(
        description="Run the KISP web app and API service")
    parser.add_argument("--host", type=str, default='0.0.0.0',
                        help="host of the service")
    parser.add_argument("--port", type=str, default=8080,
                        help="port of the service")

    parser.add_argument("--config", type=Path, required=False, help="configuration file to be used", default='./config.yml')

    args = parser.parse_args()
    config_path = args.config

    # use uvicorn to serve the app, we again have to set the configuration parameters outside the app because uvicorn is an independent layer
    server_config = load_server_config(config_path)
    from kisp.users import auth_backend, current_active_user, fastapi_users

    app = get_app(server_config)

    uvicorn.run(app, 
        port=server_config['port'], 
        host=server_config['host'], 
        reload=server_config['reload'], 
        root_path=server_config['api_route'],
        log_level=server_config['log_level'])
