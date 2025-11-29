from fastapi import APIRouter, HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token, did_from_email, generate_verification_code
from app.db.memory import db
from app.models.schemas import EmailRequestPayload, EmailVerifyPayload, EmailVerifyResponse


router = APIRouter(prefix="/email")


@router.post("/request")
async def request_email_verification(payload: EmailRequestPayload) -> dict:
  record = db.upsert_email_code(payload.email, generate_verification_code())
  response: dict = {"message": "verification code issued"}
  if settings.environment != "production":
    response["debugCode"] = record.code
  return response


@router.post("/verify", response_model=EmailVerifyResponse)
async def verify_email_code(payload: EmailVerifyPayload) -> EmailVerifyResponse:
  if not db.verify_email_code(payload.email, payload.code):
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Invalid or expired verification code",
    )
  db.consume_email_code(payload.email)
  did = did_from_email(payload.email)
  token = create_access_token(
    subject=did,
    claims={"did": did, "email": payload.email},
  )
  return EmailVerifyResponse(sessionJWT=token, did=did)
