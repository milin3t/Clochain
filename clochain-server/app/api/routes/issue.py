import base64
import hashlib
import hmac
import io
import json
import secrets
import time
import uuid

import qrcode
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_session
from app.core.config import settings
from app.db.memory import IssueRecord, db
from app.models.schemas import IssuePayload, IssueRequest, IssueResponse

router = APIRouter()


def _generate_nonce() -> str:
  length = secrets.choice([4, 5, 6])  # results in 8~12 hex chars
  return secrets.token_hex(length)


def _sign_payload(payload_json: str) -> str:
  return hmac.new(settings.hmac_secret.encode(), payload_json.encode(), hashlib.sha256).hexdigest()


def _encode_short_token(payload_json: str, signature: str) -> str:
  combined = f"{payload_json}.{signature}".encode()
  return base64.urlsafe_b64encode(combined).decode().rstrip("=")


def _build_qr_base64(short_token: str) -> str:
  qr_data = f"https://{settings.domain}/shop/verify?q={short_token}"
  qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=4)
  qr.add_data(qr_data)
  qr.make(fit=True)
  img = qr.make_image(fill_color="black", back_color="white")
  buffer = io.BytesIO()
  img.save(buffer, format="PNG")
  encoded = base64.b64encode(buffer.getvalue()).decode()
  return f"data:image/png;base64,{encoded}"


@router.post("/issue", response_model=IssueResponse)
async def issue_qr(request: IssueRequest, session: dict = Depends(get_current_session)) -> IssueResponse:
  user_email = session.get("email")
  if not user_email:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authenticated email required")

  payload = IssuePayload(
    issuer=user_email,
    product_type=request.product_type,
    timestamp=int(time.time() * 1000),
    nonce=_generate_nonce(),
  )
  payload_dict = payload.model_dump()
  payload_json = json.dumps(payload_dict, separators=(",", ":"), sort_keys=True)

  signature = _sign_payload(payload_json)
  short_token = _encode_short_token(payload_json, signature)
  if len(short_token) > 350:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="short_token length overflow")

  issue_id = str(uuid.uuid4())
  db.store_issue(IssueRecord(issue_id=issue_id, short_token=short_token, payload=payload_dict, signature=signature))

  qr_base64 = _build_qr_base64(short_token)

  return IssueResponse(short_token=short_token, payload=payload, signature=signature, qr_base64=qr_base64)
