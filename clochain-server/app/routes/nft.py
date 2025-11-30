from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.security import get_current_wallet
from app.db.session import get_session
from app.services.nft_service import NFTService

router = APIRouter()


class RegisterRequest(BaseModel):
  q: str


class RegisterResponse(BaseModel):
  tokenId: str
  tokenURI: str
  txHash: str
  cid: str
  metadata: dict
  payload: dict


class NFTItemResponse(BaseModel):
  tokenId: str
  brand: str
  productId: str
  tokenURI: str


class TransferRequest(BaseModel):
  tokenId: str
  to: str


class TransferResponse(BaseModel):
  txHash: str


@router.get("/me", response_model=list[NFTItemResponse])
def my_nfts(wallet: str = Depends(get_current_wallet), session=Depends(get_session)):
  service = NFTService(session)
  return service.list_wallet_nfts(wallet)


@router.post("/register", response_model=RegisterResponse)
def register_nft(payload: RegisterRequest, wallet: str = Depends(get_current_wallet), session=Depends(get_session)):
  service = NFTService(session)
  token_id, token_uri, tx_hash, cid, metadata, qr_payload = service.register(payload.q, wallet)
  return RegisterResponse(tokenId=token_id, tokenURI=token_uri, txHash=tx_hash, cid=cid, metadata=metadata, payload=qr_payload)


@router.post("/transfer", response_model=TransferResponse)
def transfer_nft(payload: TransferRequest, wallet: str = Depends(get_current_wallet), session=Depends(get_session)):
  service = NFTService(session)
  tx_hash = service.transfer(payload.tokenId, wallet, payload.to)
  return TransferResponse(txHash=tx_hash)
