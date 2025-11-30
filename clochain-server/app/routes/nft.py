from fastapi import APIRouter, Depends, HTTPException
from pydantic import AliasChoices, BaseModel, Field

from app.core.security import get_current_wallet
from app.db.session import get_session
from app.services.nft_service import NFTService

router = APIRouter()


class NFTItemResponse(BaseModel):
  tokenId: str
  brand: str
  productId: str
  tokenURI: str


class MetadataRequest(BaseModel):
  short_token: str = Field(validation_alias=AliasChoices("short_token", "shortToken"))


class MetadataResponse(BaseModel):
  cid: str
  metadata: dict
  payload: dict


class RecordRequest(BaseModel):
  tokenId: str = Field(validation_alias=AliasChoices("tokenId", "token_id"))
  walletAddress: str = Field(validation_alias=AliasChoices("walletAddress", "wallet_address"))
  cid: str
  payload: dict


class RecordResponse(BaseModel):
  ok: bool
  tokenId: str
  walletAddress: str
  cid: str


class TransferRecordRequest(BaseModel):
  tokenId: str = Field(validation_alias=AliasChoices("tokenId", "token_id"))
  fromWallet: str = Field(validation_alias=AliasChoices("fromWallet", "from_wallet"))
  toWallet: str = Field(validation_alias=AliasChoices("toWallet", "to_wallet"))
  txHash: str = Field(validation_alias=AliasChoices("txHash", "tx_hash"))
  blockNumber: int | None = Field(
    default=None,
    validation_alias=AliasChoices("blockNumber", "block_number"),
  )


class TransferRecordResponse(BaseModel):
  ok: bool
  txHash: str


@router.get("/me", response_model=list[NFTItemResponse])
def my_nfts(wallet: str = Depends(get_current_wallet), session=Depends(get_session)):
  service = NFTService(session)
  return service.list_wallet_nfts(wallet.lower())


@router.post("/metadata", response_model=MetadataResponse)
def build_metadata(payload: MetadataRequest, session=Depends(get_session)):
  service = NFTService(session)
  cid, metadata, qr_payload = service.create_metadata(payload.short_token)
  return MetadataResponse(cid=cid, metadata=metadata, payload=qr_payload)


@router.post("/record", response_model=RecordResponse)
def record_nft_registration(
  payload: RecordRequest,
  wallet: str = Depends(get_current_wallet),
  session=Depends(get_session),
):
  service = NFTService(session)
  if wallet.lower() != payload.walletAddress.lower():
    raise HTTPException(status_code=403, detail="Wallet mismatch")
  record = service.record_nft(payload.tokenId, payload.walletAddress, payload.cid, payload.payload)
  return RecordResponse(ok=True, tokenId=record["tokenId"], walletAddress=record["wallet"], cid=record["cid"])


@router.post("/record-transfer", response_model=TransferRecordResponse)
def record_transfer_event(
  payload: TransferRecordRequest,
  wallet: str = Depends(get_current_wallet),
  session=Depends(get_session),
):
  if wallet.lower() != payload.fromWallet.lower():
    raise HTTPException(status_code=403, detail="Wallet mismatch")
  service = NFTService(session)
  service.record_transfer(payload.tokenId, payload.fromWallet, payload.toWallet, payload.txHash, payload.blockNumber)
  return TransferRecordResponse(ok=True, txHash=payload.txHash)
