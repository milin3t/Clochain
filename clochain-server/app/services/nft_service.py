import uuid

from fastapi import HTTPException, status

from app.core.did import did_to_wallet
from app.core.hmac_utils import decode_short_token
from app.db import crud


class NFTService:
  def __init__(self, session):
    self.session = session

  def register(self, short_token: str):
    payload, signature = decode_short_token(short_token)
    issue = crud.get_issue_by_token(self.session, short_token)
    if not issue:
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    metadata = self._build_metadata(payload, short_token)
    cid = self._upload_metadata(metadata)
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
    return token_id, token_uri, tx_hash

  def transfer(self, token_id: str, to_did: str):
    nft = crud.get_nft_by_token(self.session, token_id)
    if not nft:
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NFT not found")
    from_wallet = nft.owner_wallet
    to_wallet = did_to_wallet(to_did)
    tx_hash = self._transfer_on_chain(token_id, from_wallet, to_wallet)
    crud.update_nft_owner(self.session, token_id, to_wallet)
    crud.record_transfer(self.session, token_id, from_wallet, to_wallet, tx_hash)
    return tx_hash

  def _build_metadata(self, payload: dict, short_token: str) -> dict:
    return {
      "name": f"{payload['brand']} {payload['productId']}",
      "description": "CloChain authenticity NFT",
      "external_url": f"https://clochain-shop.vercel.app/shop/verify?q={short_token}",
      "attributes": [
        {"trait_type": "brand", "value": payload["brand"]},
        {"trait_type": "productId", "value": payload["productId"]},
        {"trait_type": "purchaseAt", "value": payload["purchaseAt"]},
        {"trait_type": "firstOwnerDID", "value": payload["did"]},
      ],
    }

  def _upload_metadata(self, metadata: dict) -> str:
    return f"mock-cid-{uuid.uuid4().hex}"

  def _mint_on_chain(self, did: str, token_uri: str):
    token_id = uuid.uuid4().hex
    tx_hash = f"0xtx-{uuid.uuid4().hex}"
    return token_id, tx_hash

  def _transfer_on_chain(self, token_id: str, from_wallet: str, to_wallet: str) -> str:
    return f"0xtransfer-{token_id}-{uuid.uuid4().hex}"
