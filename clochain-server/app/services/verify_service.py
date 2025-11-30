from app.core.hmac_utils import decode_short_token
from app.db import crud


class VerifyService:
  def __init__(self, session):
    self.session = session

  def verify(self, short_token: str):
    payload, signature = decode_short_token(short_token)
    registered = crud.is_payload_registered(self.session, payload)
    return payload, signature, registered
