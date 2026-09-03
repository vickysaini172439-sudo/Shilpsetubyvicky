from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

# "check_same_thread" is only needed for SQLite so FastAPI's multiple
# background threads are allowed to share the same database file.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """
    FastAPI dependency: gives each request its own database session,
    and always closes it afterwards, even if an error happens.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
