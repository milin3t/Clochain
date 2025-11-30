from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.config import settings
from app.db.session import init_db
from app.routes import auth_wallet, issue, nft, verify


class LoggingMiddleware(BaseHTTPMiddleware):
  async def dispatch(self, request: Request, call_next: RequestResponseEndpoint):
    response = await call_next(request)
    return response


def create_app() -> FastAPI:
  init_db()
  app = FastAPI(title=settings.app_name, version="2.0.0")
  app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
  )
  app.add_middleware(LoggingMiddleware)

  @app.exception_handler(Exception)
  async def handle_exceptions(_: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)})

  app.include_router(auth_wallet.router, prefix="/auth", tags=["auth"])
  app.include_router(issue.router, tags=["issue"])
  app.include_router(verify.router, tags=["verify"])
  app.include_router(nft.router, prefix="/nft", tags=["nft"])

  @app.get("/ping")
  async def ping():
    return {"pong": True}

  return app


app = create_app()
