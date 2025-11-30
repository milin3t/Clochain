from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings
from app.core.did import to_did

bearer_scheme = HTTPBearer(auto_error=True)


def _now() -> datetime:
  return datetime.now(tz=timezone.utc)


def create_wallet_token(wallet: str, expires_minutes: int | None = None) -> str:
  did = to_did(wallet)
  payload: Dict[str, Any] = {
    "wallet": wallet,
    "did": did,
  }
  expire = _now() + timedelta(minutes=expires_minutes or settings.jwt_exp_minutes)
  payload["exp"] = int(expire.timestamp())
  return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Dict[str, Any]:
  try:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
  except JWTError as exc:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


def get_current_wallet(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> str:
  token = credentials.credentials
  try:
    claims = decode_token(token)
  except HTTPException:
    claims = None
  except JWTError:
    claims = None

  if claims:
    wallet = claims.get("wallet")
    if wallet:
      return wallet.lower()

  # Fall back to accepting direct wallet strings (for embedded-wallet clients that transmit raw addresses).
  lowered = token.lower()
  if lowered.startswith("0x") and len(lowered) == 42:
    # Validate wallet address shape by converting to DID (raises if invalid)
    to_did(lowered)
    return lowered

  raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized wallet token")
