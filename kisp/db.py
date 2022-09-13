from typing import AsyncGenerator

from fastapi import Depends
from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import DeclarativeMeta, declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Table, Column, Integer, String, ForeignKey, Float, DateTime, Boolean

import contextlib

DATABASE_URL = "sqlite+aiosqlite:///./resources/data/data.db"
Base: DeclarativeMeta = declarative_base()

class User(SQLAlchemyBaseUserTableUUID, Base):
    first_name = Column(String(255), nullable=True)
    last_name = Column(String(255), nullable=True)
    role = Column(String(255), nullable=True)

class UserPreferences(Base):
    '''
    To store a set of user preferences
    '''
    __tablename__ = "preferences"

    user_id = Column(String, ForeignKey("user.id"), primary_key=True)
    auto_move_on = Column(Boolean)
    dark_mode = Column(Boolean)

class Label(Base):
    '''
    A dataset can have N labels
    '''
    __tablename__ = "label"

    id = Column(String, primary_key=True)
    name = Column(String)
    color = Column(String)
    description = Column(String)
    dataset_id = Column(String, ForeignKey("dataset.id"))
    type = Column(String)

class Task(Base):
    '''
    If a task is a redundant task, it is indicated by the redundant field
    pointing to the primary task. A user cannot be assigned to more than one 
    task corresponding to the same primary task. 
    '''
    __tablename__ = "task"

    id = Column(String, primary_key=True)
    dataset_id = Column(String, ForeignKey("dataset.id"))
    name = Column(String)
    type = Column(String)
    redundant = Column(String, ForeignKey("task.id"))

class Document(Base):
    __tablename__ = "document"

    id = Column(String, primary_key=True)
    doi = Column(String)
    pmc = Column(String)
    pmid = Column(String)
    pdf_uri = Column(String)
    tei_uri = Column(String)

class Excerpt(Base):
    '''
    A document has N excerpts, an excerpt belong to 1 document
    '''
    __tablename__ = "excerpt"

    id = Column(String, primary_key=True)
    text = Column(String)
    full_context = Column(String)
    document_id = Column(String, ForeignKey("document.id"), nullable=False)
    dataset_id = Column(String, ForeignKey("dataset.id"), nullable=False)
    offset_start = Column(Integer)
    offset_end = Column(Integer)
    
class Coordinate(Base):
    '''
    A bounding box. An excerpt can have N bounding boxes
    '''
    __tablename__ = "coordinate"

    id = Column(String, primary_key=True)
    page = Column(Integer)
    x = Column(Float)
    y = Column(Float)
    h = Column(Float)
    w = Column(Float)
    excerpt_id = Column(String, ForeignKey("excerpt.id"), nullable=False)

class Annotation(Base):
    __tablename__ = "annotation"

    id = Column(String, primary_key=True)
    task_id = Column(String, ForeignKey("task.id"))
    excerpt_id = Column(String, ForeignKey("excerpt.id"), nullable=False)
    user_id = Column(String, ForeignKey("user.id"))
    label_id = Column(String, ForeignKey("label.id"))
    original_id = Column(String)
    offset_start = Column(Integer)
    offset_end = Column(Integer)
    source = Column(String)
    value = Column(Boolean)
    score = Column(Float)
    chunk = Column(String)
    date = Column(DateTime)
    type = Column(String)
    ignored = Column(Boolean)
    comment = Column(String)

class Dataset(Base):
    __tablename__ = "dataset"

    id = Column(String, primary_key=True)
    name = Column(String)
    description = Column(String)
    image_url = Column(String)
    nb_documents = Column(Integer)
    nb_excerpts = Column(Integer)
    nb_tasks = Column(Integer)

class InCollection(Base):
    '''
    N-N relation between a dataset (set of documents) and a document (which can belong to 
    several datasets)
    '''
    __tablename__ = "incollection"

    dataset_id = Column(String, ForeignKey("dataset.id"), nullable=False, primary_key=True)
    document_id = Column(String, ForeignKey("document.id"), nullable=False, primary_key=True)
    
class InTask(Base):
    '''
    N-N relation between a task and an excerpt 
    '''
    __tablename__ = "intask"

    task_id = Column(String, ForeignKey("task.id"), nullable=False, primary_key=True)
    excerpt_id = Column(String, ForeignKey("excerpt.id"), nullable=False, primary_key=True)

class Assign(Base):
    '''
    N-N relation for user assigned to task
    '''
    __tablename__ = "assign"

    task_id = Column(String, ForeignKey("task.id"), nullable=False, primary_key=True, unique=True)
    user_id = Column(String, ForeignKey("user.id"), nullable=False, primary_key=True)
    in_progress = Column(Boolean)
    is_completed = Column(Boolean)
    completed_excerpts = Column(Integer)

engine = create_async_engine(DATABASE_URL)
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)

def row2dict(row):
    return row._asdict()
