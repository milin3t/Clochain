from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, echo=False, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, class_=Session)


def init_db() -> None:
  from app.db import models  # noqa: F401

  models.Base.metadata.create_all(bind=engine)


def get_session():
  session = SessionLocal()
  try:
    yield session
  finally:
    session.close()
