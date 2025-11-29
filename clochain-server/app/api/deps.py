from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import TokenDecodeError, verify_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_session(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
  if not credentials:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Authorization header missing",
    )
  token = credentials.credentials
  try:
    payload = verify_token(token)
  except TokenDecodeError as exc:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="Invalid or expired token",
    ) from exc
  return payload
