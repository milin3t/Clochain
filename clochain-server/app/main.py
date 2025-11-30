from logging.config import dictConfig

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, issue, verify
from app.core.config import settings
from app.core.logging_config import LOGGING_CONFIG


def create_app() -> FastAPI:
  dictConfig(LOGGING_CONFIG)
  app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="CloChain authenticity service.",
  )

  app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
  )

  app.include_router(auth.router, prefix="/auth", tags=["auth"])
  app.include_router(issue.router, tags=["issue"])
  app.include_router(verify.router, tags=["verify"])

  @app.get("/ping")
  async def ping():
    return {"pong": True}

  return app


app = create_app()
