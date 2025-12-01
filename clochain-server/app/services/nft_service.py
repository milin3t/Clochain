from fastapi import HTTPException, status
import httpx

from app.core.config import settings
from app.core.did import did_to_wallet, to_did
from app.core.hmac_utils import decode_short_token, encode_short_token, sign_payload
from app.db import crud
from app.services.onchain import fetch_wallet_tokens_onchain, mint_via_web3
from app.services.pinata_service import PinataService


class NFTService:
  def __init__(self, session, pinata: PinataService | None = None):
    self.session = session
    self.pinata = pinata or PinataService(settings.pinata_api_key, settings.pinata_secret, settings.pinata_jwt)

  def create_metadata(self, short_token: str):
    payload, _ = decode_short_token(short_token)
    issue = crud.get_issue_by_token(self.session, short_token)
    if not issue:
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    metadata = self._build_metadata(payload, short_token)
    cid = self.pinata.upload_metadata(metadata)
    return cid, metadata, payload

  def record_nft(self, token_id: str, wallet_address: str, cid: str, payload: dict):
    normalized_wallet = wallet_address.lower()
    to_did(normalized_wallet)
    expected_wallet = did_to_wallet(payload["did"])
    if expected_wallet != normalized_wallet:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Wallet does not match DID")
    short_token = self._reconstruct_short_token(payload)
    issue = crud.get_issue_by_token(self.session, short_token)
    if not issue:
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issued token not found for payload")
    if crud.is_payload_registered(self.session, payload):
      raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="NFT already registered for this payload")
    crud.create_nft_record(
      self.session,
      token_id=token_id,
      wallet_address=normalized_wallet,
      cid=cid,
      payload=payload,
      first_owner_wallet=normalized_wallet,
    )
    return {"tokenId": token_id, "wallet": normalized_wallet, "cid": cid}

  def record_transfer(
    self,
    token_id: str,
    from_wallet: str,
    to_wallet: str,
    tx_hash: str,
    block_number: int | None = None,
  ):
    nft = crud.get_nft_by_token(self.session, token_id)
    if not nft:
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="NFT not found")
    current_owner = nft.owner_wallet.lower()
    normalized_from = from_wallet.lower()
    normalized_to = to_wallet.lower()
    if current_owner != normalized_from:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Recorded owner mismatch")
    if normalized_from == normalized_to:
      raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot transfer to the same wallet")
    to_did(normalized_from)
    to_did(normalized_to)
    crud.update_nft_owner(self.session, token_id, normalized_to)
    crud.record_transfer(
      self.session,
      token_id=token_id,
      from_wallet=normalized_from,
      to_wallet=normalized_to,
      tx_hash=tx_hash,
      block_number=block_number,
    )
    return {"txHash": tx_hash}

  def list_wallet_nfts(self, wallet_address: str):
    normalized_wallet = wallet_address.lower()
    stored_nfts = crud.list_nfts_by_owner(self.session, normalized_wallet)
    result_map: dict[str, dict] = {
      nft.token_id: {
        "tokenId": nft.token_id,
        "brand": nft.brand,
        "productId": nft.product_id,
        "tokenURI": f"ipfs://{nft.cid}",
      }
      for nft in stored_nfts
    }
    onchain_entries: list[dict] = []
    try:
      onchain_entries = fetch_wallet_tokens_onchain(normalized_wallet)
    except HTTPException:
      onchain_entries = []

    for entry in onchain_entries:
      token_id = entry.get("tokenId")
      if not token_id or token_id in result_map:
        continue
      token_uri = entry.get("tokenURI") or ""
      metadata = self._load_metadata_from_token_uri(token_uri)
      brand, product_id = self._extract_fields_from_metadata(metadata)
      result_map[token_id] = {
        "tokenId": token_id,
        "brand": brand or "Unknown",
        "productId": product_id or "N/A",
        "tokenURI": token_uri or "",
      }

    # sort by numeric tokenId desc for consistent UX
    return sorted(result_map.values(), key=lambda item: int(item["tokenId"]), reverse=True)

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

  def _reconstruct_short_token(self, payload: dict) -> str:
    signature = sign_payload(payload)
    return encode_short_token(payload, signature)

  def _load_metadata_from_token_uri(self, token_uri: str) -> dict | None:
    if not token_uri:
      return None
    url = self._resolve_token_uri(token_uri)
    if not url:
      return None
    try:
      response = httpx.get(url, timeout=10)
      response.raise_for_status()
      return response.json()
    except httpx.HTTPError:
      return None

  def _resolve_token_uri(self, token_uri: str) -> str | None:
    if token_uri.startswith("ipfs://"):
      cid = token_uri.replace("ipfs://", "")
      return f"https://gateway.pinata.cloud/ipfs/{cid}"
    return token_uri

  def _extract_fields_from_metadata(self, metadata: dict | None) -> tuple[str | None, str | None]:
    if not metadata:
      return None, None
    attributes = metadata.get("attributes") or []
    attr_map = {}
    for attr in attributes:
      name = attr.get("trait_type")
      value = attr.get("value")
      if name and value is not None:
        attr_map[name] = value
    brand = attr_map.get("brand") or metadata.get("brand")
    product_id = attr_map.get("productId") or metadata.get("productId")
    if not product_id and metadata.get("name"):
      name_str = str(metadata["name"])
      if " " in name_str:
        product_id = name_str.split(" ", 1)[1]
    return brand, product_id

  def register_nft(self, short_token: str, wallet_address: str):
    normalized_wallet = wallet_address.lower()
    payload, _ = decode_short_token(short_token)

    expected_wallet = did_to_wallet(payload["did"])
    if normalized_wallet != expected_wallet:
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Wallet does not match DID")

    issue = crud.get_issue_by_token(self.session, short_token)
    if not issue:
      raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    if crud.is_payload_registered(self.session, payload):
      raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="NFT already registered for this payload")

    metadata = self._build_metadata(payload, short_token)
    cid = self.pinata.upload_metadata(metadata)
    token_uri = f"ipfs://{cid}"
    product_hash_source = self._build_product_hash_source(payload, normalized_wallet)
    result = mint_via_web3(normalized_wallet, token_uri, product_hash_source)
    token_id = result.get("tokenId")
    if not token_id:
      raise HTTPException(status_code=500, detail="Unable to obtain tokenId from mint transaction")

    crud.create_nft_record(
      self.session,
      token_id=str(token_id),
      wallet_address=normalized_wallet,
      cid=cid,
      payload=payload,
      first_owner_wallet=normalized_wallet,
    )

    return {
      "tokenId": str(token_id),
      "cid": cid,
      "metadata": metadata,
      "txHash": result.get("txHash"),
      "blockNumber": result.get("blockNumber"),
    }

  def _build_product_hash_source(self, payload: dict, wallet_address: str) -> str:
    return "|".join(
      [
        payload["brand"],
        payload["productId"],
        payload["purchaseAt"],
        wallet_address,
        payload.get("nonce", ""),
      ]
    )
