import uuid

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.did import did_to_wallet, to_did
from app.core.hmac_utils import decode_short_token
from app.db import crud
from app.services.pinata_service import PinataService


class NFTService:
  def __init__(self, session, pinata: PinataService | None = None):
    self.session = session
    self.pinata = pinata or PinataService(settings.pinata_api_key, settings.pinata_secret)

  def register(self, short_token: str, wallet_address: str):
    payload, _ = decode_short_token(short_token)
    issue = crud.get_issue_by_token(self.session, short_token)
    if not issue:
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    normalized_wallet = wallet_address.lower()
    expected_wallet = did_to_wallet(payload["did"])
    if expected_wallet != normalized_wallet:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="QR DID does not match current wallet")
    if issue.owner_wallet.lower() != normalized_wallet:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="QR was not issued for this wallet")
    if crud.is_payload_registered(self.session, payload):
      raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="NFT already registered for this payload")

    metadata = self._build_metadata(payload, short_token)
    cid = self.pinata.upload_metadata(metadata)
    token_uri = f"ipfs://{cid}"
    token_id, tx_hash = self._mint_on_chain(payload["did"], token_uri)
    first_owner_wallet = did_to_wallet(payload["did"])
    crud.create_nft_record(
      self.session,
      token_id=token_id,
      token_uri=token_uri,
      payload=payload,
      first_owner_wallet=first_owner_wallet,
      first_owner_did=payload["did"],
    )
    return token_id, token_uri, tx_hash, cid, metadata, payload

  def transfer(self, token_id: str, initiator_wallet: str, to_identifier: str):
    nft = crud.get_nft_by_token(self.session, token_id)
    if not nft:
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NFT not found")
    current_owner = nft.owner_wallet.lower()
    if current_owner != initiator_wallet.lower():
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can transfer this NFT")
    to_wallet = self._normalize_wallet_identifier(to_identifier)
    if to_wallet == current_owner:
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot transfer to the same wallet")

    tx_hash = self._transfer_on_chain(token_id, current_owner, to_wallet)
    crud.update_nft_owner(self.session, token_id, to_wallet)
    crud.record_transfer(self.session, token_id, current_owner, to_wallet, tx_hash)
    return tx_hash

  def list_wallet_nfts(self, wallet_address: str):
    nfts = crud.list_nfts_by_owner(self.session, wallet_address.lower())
    return [
      {
        "tokenId": nft.token_id,
        "brand": nft.brand,
        "productId": nft.product_id,
        "tokenURI": nft.token_uri,
      }
      for nft in nfts
    ]

  def _build_metadata(self, payload: dict, short_token: str) -> dict:
    issued_at = payload.get("issuedAt")
    metadata = {
      "name": f"{payload['brand']} {payload['productId']}",
      "description": "CloChain authenticity NFT",
      "external_url": f"https://clochain-shop.vercel.app/shop/verify?q={short_token}",
      "attributes": [
        {"trait_type": "brand", "value": payload["brand"]},
        {"trait_type": "productId", "value": payload["productId"]},
        {"trait_type": "purchaseAt", "value": payload["purchaseAt"]},
        {"trait_type": "firstOwnerDID", "value": payload["did"]},
        {"trait_type": "issuedBy", "value": settings.app_name},
      ],
    }
    if issued_at:
      metadata["attributes"].append({"trait_type": "issuedAt", "value": issued_at})
    return metadata

  def _normalize_wallet_identifier(self, identifier: str) -> str:
    value = identifier.strip()
    if value.startswith("did:ethr:"):
      return did_to_wallet(value)
    # Validate wallet format via to_did, then convert back to normalized wallet.
    return did_to_wallet(to_did(value))

  def _mint_on_chain(self, did: str, token_uri: str):
    token_id = uuid.uuid4().hex
    tx_hash = f"0xtx-{uuid.uuid4().hex}"
    return token_id, tx_hash

  def _transfer_on_chain(self, token_id: str, from_wallet: str, to_wallet: str) -> str:
    return f"0xtransfer-{token_id}-{uuid.uuid4().hex}"
