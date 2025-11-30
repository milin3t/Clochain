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
  claims = decode_token(credentials.credentials)
  wallet = claims.get("wallet")
  if not wallet:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="wallet missing in token")
  return wallet.lower()
