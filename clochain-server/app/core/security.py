import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from jose import JWTError, jwt

from app.core.config import settings


def _now() -> datetime:
  return datetime.now(tz=timezone.utc)


def create_access_token(subject: str, claims: Dict[str, Any] | None = None, expires_minutes: int | None = None) -> str:
  expire = _now() + timedelta(minutes=expires_minutes or settings.jwt_exp_minutes)
  payload = {"sub": subject, "exp": expire}
  if claims:
    payload.update(claims)
  return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Dict[str, Any]:
  return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def did_from_email(email: str) -> str:
  return f"did:email:{email.lower()}"


def generate_verification_code() -> str:
  return f"{secrets.randbelow(999999):06d}"


def generate_nonce() -> str:
  return secrets.token_urlsafe(12)


def generate_short_token() -> str:
  return secrets.token_urlsafe(10)


def sign_issue_payload(payload: Dict[str, Any]) -> str:
  serialized = "&".join(f"{key}={payload[key]}" for key in sorted(payload.keys()))
  signature = hmac.new(settings.hmac_secret.encode(), serialized.encode(), hashlib.sha256).digest()
  return base64.urlsafe_b64encode(signature).decode()


class TokenDecodeError(Exception):
  pass


def verify_token(token: str) -> Dict[str, Any]:
  try:
    return decode_token(token)
  except JWTError as exc:
    raise TokenDecodeError(str(exc)) from exc
