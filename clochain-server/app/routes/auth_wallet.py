from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.db.session import get_session
from app.services.auth_service import AuthService

router = APIRouter()


class WalletRequest(BaseModel):
  walletAddress: str

  model_config = {"populate_by_name": True}


class WalletVerify(BaseModel):
  walletAddress: str
  signature: str

  model_config = {"populate_by_name": True}


@router.post("/wallet/request")
def request_nonce(payload: WalletRequest, session=Depends(get_session)):
  service = AuthService(session)
  nonce = service.issue_nonce(payload.walletAddress)
  return {"wallet": payload.walletAddress.lower(), "nonce": nonce}


@router.post("/wallet/verify")
def verify_signature(payload: WalletVerify, session=Depends(get_session)):
  service = AuthService(session)
  token = service.verify_signature(payload.walletAddress, payload.signature)
  return {
    "access_token": token,
    "did": f"did:ethr:{payload.walletAddress.lower()}",
  }
