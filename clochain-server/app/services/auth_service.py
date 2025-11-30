import secrets
from datetime import datetime, timedelta, timezone

from eth_account import Account
from eth_account.messages import encode_defunct
from fastapi import HTTPException, status

from app.core.security import create_wallet_token
from app.db import crud


class AuthService:
  _nonce_store: dict[str, tuple[str, datetime]] = {}
  _ttl_minutes = 10

  def __init__(self, session):
    self.session = session

  def issue_nonce(self, wallet_address: str) -> str:
    wallet = wallet_address.lower()
    nonce = secrets.token_hex(16)
    expires = datetime.now(timezone.utc) + timedelta(minutes=self._ttl_minutes)
    self._nonce_store[wallet] = (nonce, expires)
    crud.ensure_user(self.session, wallet)
    return nonce

  def verify_signature(self, wallet_address: str, signature: str) -> str:
    wallet = wallet_address.lower()
    record = self._nonce_store.get(wallet)
    if not record:
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nonce not issued")
    nonce, expires = record
    if datetime.now(timezone.utc) > expires:
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nonce expired")

    message = encode_defunct(text=nonce)
    recovered = Account.recover_message(message, signature=signature)
    if recovered.lower() != wallet:
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Signature mismatch")

    token = create_wallet_token(wallet)
    del self._nonce_store[wallet]
    return token
