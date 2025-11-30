from app.core.hmac_utils import decode_short_token


class VerifyService:
  def __init__(self, session):
    self.session = session

  def verify(self, short_token: str):
    payload, signature = decode_short_token(short_token)
    return payload, signature
