import base64
import io
from datetime import datetime, timezone

import qrcode

from app.core.did import to_did
from app.core.hmac_utils import encode_short_token, random_nonce, sign_payload
from app.db import crud


class IssueService:
  def __init__(self, session):
    self.session = session

  def issue(self, request_data: dict) -> dict:
    owner_wallet = request_data["ownerWallet"]
    payload = {
      "brand": request_data["brand"],
      "productId": request_data["productId"],
      "purchaseAt": request_data["purchaseAt"],
      "did": to_did(owner_wallet),
      "nonce": random_nonce(),
      "issuedAt": datetime.now(timezone.utc).isoformat(),
    }
    signature = sign_payload(payload)
    short_token = encode_short_token(payload, signature)
    crud.create_issue(self.session, short_token, payload, signature)
    qr_base64 = self._build_qr(short_token)
    return {
      "short_token": short_token,
      "qr_base64": qr_base64,
      "payload": payload,
      "signature": signature,
    }

  def _build_qr(self, short_token: str) -> str:
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M)
    verify_url = f"https://clochain-shop.vercel.app/shop/verify?q={short_token}"
    qr.add_data(verify_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{encoded}"
