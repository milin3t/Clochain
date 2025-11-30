from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.db.session import get_session
from app.services.nft_service import NFTService

router = APIRouter()


class RegisterRequest(BaseModel):
  q: str


class RegisterResponse(BaseModel):
  tokenId: str
  tokenURI: str
  txHash: str


class TransferRequest(BaseModel):
  tokenId: str
  toDid: str


class TransferResponse(BaseModel):
  txHash: str


@router.post("/register", response_model=RegisterResponse)
def register_nft(payload: RegisterRequest, session=Depends(get_session)):
  service = NFTService(session)
  token_id, token_uri, tx_hash = service.register(payload.q)
  return RegisterResponse(tokenId=token_id, tokenURI=token_uri, txHash=tx_hash)


@router.post("/transfer", response_model=TransferResponse)
def transfer_nft(payload: TransferRequest, session=Depends(get_session)):
  service = NFTService(session)
  tx_hash = service.transfer(payload.tokenId, payload.toDid)
  return TransferResponse(txHash=tx_hash)
