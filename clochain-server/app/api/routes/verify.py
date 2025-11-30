import base64
import hashlib
import hmac
import json
import time
from typing import Tuple

from fastapi import APIRouter, HTTPException, status

from app.core.config import settings
from app.models.schemas import IssuePayload, VerifyRequest, VerifyResponse

router = APIRouter()


def _decode_short_token(short_token: str) -> Tuple[str, str]:
  padding = "=" * (-len(short_token) % 4)
  try:
    decoded = base64.urlsafe_b64decode(short_token + padding).decode()
  except (ValueError, UnicodeDecodeError) as exc:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Malformed short token",
    ) from exc
  if "." not in decoded:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Malformed payload structure",
    )
  payload_json, signature_hex = decoded.rsplit(".", 1)
  return payload_json, signature_hex


def _compute_signature(payload_json: str) -> str:
  digest = hmac.new(settings.hmac_secret.encode(), payload_json.encode(), hashlib.sha256).hexdigest()
  return digest


@router.post("/verify", response_model=VerifyResponse)
async def verify_short_token(request: VerifyRequest) -> VerifyResponse:
  payload_json, signature_hex = _decode_short_token(request.short_token)

  expected_signature = _compute_signature(payload_json)
  if not hmac.compare_digest(signature_hex, expected_signature):
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Invalid signature",
    )

  try:
    payload_dict = json.loads(payload_json)
  except json.JSONDecodeError as exc:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Payload JSON is invalid",
    ) from exc

  try:
    payload = IssuePayload(**payload_dict)
  except Exception as exc:
    raise HTTPException(
      status_code=status.HTTP_400_BAD_REQUEST,
      detail="Payload shape mismatch",
    ) from exc

  current_ms = int(time.time() * 1000)
  stale = current_ms - payload.timestamp > 10 * 60 * 1000

  return VerifyResponse(
    is_valid=True,
    payload=payload,
    message="Valid token" if not stale else "Valid token (stale)",
    stale=stale,
  )
