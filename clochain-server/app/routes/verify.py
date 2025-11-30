from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.db.session import get_session
from app.services.verify_service import VerifyService

router = APIRouter()


class VerifyResponse(BaseModel):
  valid: bool
  payload: dict
  signature: str
  registered: bool


@router.get("/verify", response_model=VerifyResponse)
def verify_short_token(q: str = Query(..., alias="q"), session=Depends(get_session)):
  service = VerifyService(session)
  payload, signature, registered = service.verify(q)
  return VerifyResponse(valid=True, payload=payload, signature=signature, registered=registered)
