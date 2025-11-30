from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.db.session import get_session
from app.services.verify_service import VerifyService

router = APIRouter()


class VerifyResponse(BaseModel):
  ok: bool
  reason: str | None = None
  payload: dict | None = None
  signature: str | None = None


@router.get("/verify", response_model=VerifyResponse)
def verify_short_token(
  q: str | None = Query(default=None, alias="q"),
  token: str | None = Query(default=None),
  sig: str | None = Query(default=None),
  session=Depends(get_session),
):
  short_token = q or token
  if not short_token:
    raise HTTPException(status_code=400, detail="token or q parameter is required")
  service = VerifyService(session)
  try:
    payload, signature = service.verify(short_token)
  except HTTPException as exc:
    reason = exc.detail if isinstance(exc.detail, str) else "Invalid short token"
    return VerifyResponse(ok=False, reason=reason)
  if sig and signature and sig != signature:
    return VerifyResponse(ok=False, reason="Signature mismatch")
  return VerifyResponse(ok=True, payload=payload, signature=signature)
