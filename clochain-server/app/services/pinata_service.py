import hashlib
import json

import httpx
from fastapi import HTTPException, status


class PinataService:
  _PIN_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS"

  def __init__(self, api_key: str, secret_key: str, jwt: str | None = None) -> None:
    self.api_key = api_key or ""
    self.secret_key = secret_key or ""
    self.jwt = jwt or ""

  def upload_metadata(self, metadata: dict) -> str:
    """
    Upload metadata JSON to Pinata/IPFS and return the CID.
    Falls back to deterministic mock CID generation when API keys are not configured.
    """
    if not self._has_valid_credentials():
      return self._mock_cid(metadata)

    payload = {
      "pinataOptions": {"cidVersion": 1},
      "pinataMetadata": {"name": metadata.get("name", "CloChain NFT")},
      "pinataContent": metadata,
    }
    headers = self._build_headers()
    try:
      response = httpx.post(self._PIN_JSON_URL, json=payload, headers=headers, timeout=30.0)
      response.raise_for_status()
    except httpx.HTTPError as exc:  # noqa: BLE001
      raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Pinata upload failed") from exc

    data = response.json()
    cid = data.get("IpfsHash")
    if not cid:
      raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Pinata response missing IpfsHash")
    return cid

  def _has_valid_credentials(self) -> bool:
    has_key_pair = bool(
      self.api_key and self.secret_key and self.api_key != "pinata-key" and self.secret_key != "pinata-secret"
    )
    return bool(self.jwt) or has_key_pair

  def _build_headers(self) -> dict[str, str]:
    if self.jwt:
      return {"Authorization": f"Bearer {self.jwt}"}
    return {
      "pinata_api_key": self.api_key,
      "pinata_secret_api_key": self.secret_key,
    }

  def _mock_cid(self, metadata: dict) -> str:
    serialized = json.dumps(metadata, sort_keys=True).encode()
    digest = hashlib.sha256(serialized).hexdigest()
    # CIDv1 placeholder (not real IPFS hash but deterministic)
    return f"bafy{digest[:50]}"
