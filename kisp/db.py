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

class Label(Base):
    '''
    A task can have N labels
    '''
    __tablename__ = "label"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    color = Column(String)
    description = Column(String)
    task_id = Column(Integer, ForeignKey("task.id"), nullable=False)

class Task(Base):
    __tablename__ = "task"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    description = Column(String)
    image_url = Column(String)
    type = Column(String)

class Document(Base):
    __tablename__ = "document"

    id = Column(Integer, primary_key=True)
    pdf_uri = Column(String)
    tei_uri = Column(String)

class Excerpt(Base):
    '''
    A document has N excerpts, an excerpt belong to 1 document
    '''
    __tablename__ = "excerpt"

    id = Column(Integer, primary_key=True)
    text = Column(String)
    full_context = Column(String)
    document_id = Column(Integer, ForeignKey("document.id"), nullable=False)
    offset_start = Column(Integer)
    offset_end = Column(Integer)
    
class Coordinates(Base):
    '''
    A bounding box. An excerpt can have N bounding boxes
    '''
    __tablename__ = "coordinates"

    id = Column(Integer, primary_key=True)
    page = Column(Integer)
    x = Column(Float)
    y = Column(Float)
    h = Column(Float)
    w = Column(Float)
    excerpt_id = Column(Integer, ForeignKey("excerpt.id"), nullable=False)

class Annotation(Base):
    __tablename__ = "annotation"

    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("task.id"), nullable=False)
    excerpt_id = Column(Integer, ForeignKey("excerpt.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    label_id = Column(Integer, ForeignKey("label.id"), nullable=False)
    offset_start = Column(Integer)
    offset_end = Column(Integer)
    source = Column(String)
    value = Column(Boolean)
    score = Column(Float)
    chunk = Column(String)
    date = Column(DateTime)

class Dataset(Base):
    __tablename__ = "dataset"

    id = Column(String, primary_key=True)
    name = Column(String)
    description = Column(String)
    image_url = Column(String)

class InCollection(Base):
    '''
    N-N relation between a dataset (set of documents) and a document (which can belong to 
    several datasets)
    '''
    __tablename__ = "incollection"

    dataset_id = Column(Integer, ForeignKey("dataset.id"), nullable=False, primary_key=True)
    document_id = Column(Integer, ForeignKey("document.id"), nullable=False, primary_key=True)
    
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
