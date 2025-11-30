import base64
import hashlib
import hmac
import json
import secrets
from typing import Tuple

from fastapi import HTTPException, status

from app.core.config import settings


def random_nonce() -> str:
  return secrets.token_urlsafe(16)


def _serialize_payload(payload: dict) -> str:
  return json.dumps(payload, separators=(",", ":"), sort_keys=True)


def sign_payload(payload: dict) -> str:
  serialized = _serialize_payload(payload)
  digest = hmac.new(settings.hmac_secret.encode(), serialized.encode(), hashlib.sha256).hexdigest()
  return digest


def encode_short_token(payload: dict, signature: str) -> str:
  serialized = _serialize_payload(payload)
  combined = f"{serialized}.{signature}".encode()
  return base64.urlsafe_b64encode(combined).decode().rstrip("=")


def decode_short_token(short_token: str) -> Tuple[dict, str]:
  padding = "=" * (-len(short_token) % 4)
  try:
    decoded = base64.urlsafe_b64decode(short_token + padding).decode()
  except Exception as exc:  # noqa: BLE001
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed short token") from exc
  if "." not in decoded:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed token structure")
  payload_json, signature = decoded.rsplit(".", 1)
  payload = json.loads(payload_json)
  expected = sign_payload(payload)
  if not hmac.compare_digest(signature, expected):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token signature")
  return payload, signature
