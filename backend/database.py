import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

class Base(DeclarativeBase):
    pass

# Engine is lazily initialized so tests can inject DATABASE_URL before import
_engine = None
_SessionLocal = None

def get_engine():
    global _engine
    if _engine is None:
        DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/agencydesk")
        if DATABASE_URL.startswith("postgresql://"):
            DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
        if DATABASE_URL.startswith("sqlite"):
            from sqlalchemy.pool import StaticPool
            _engine = create_engine(
                DATABASE_URL,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )
        else:
            _engine = create_engine(DATABASE_URL)
    return _engine

def get_session_local():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal

def get_db():
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
