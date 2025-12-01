from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def _normalize_database_url(url: str) -> str:
  if url.startswith("postgres://"):
    return url.replace("postgres://", "postgresql+psycopg://", 1)
  if url.startswith("postgresql://") and "+psycopg" not in url:
    return url.replace("postgresql://", "postgresql+psycopg://", 1)
  return url


database_url = _normalize_database_url(settings.database_url)
connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
engine = create_engine(
  database_url,
  echo=False,
  future=True,
  connect_args=connect_args,
  pool_pre_ping=True,
  pool_recycle=1800,
)
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
