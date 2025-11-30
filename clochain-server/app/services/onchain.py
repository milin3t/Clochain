import json
import subprocess
from pathlib import Path

from eth_account import Account
from fastapi import HTTPException, status

from app.core.config import settings

SCRIPTS_DIR = Path(__file__).resolve().parent.parent.parent / "scripts"
ETHERS_RUNNER = SCRIPTS_DIR / "ethers-runner.mjs"


def mint_via_ethers(to_address: str, token_uri: str) -> dict:
  if not ETHERS_RUNNER.exists():
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ethers runner script missing")

  rpc_url = settings.rpc_url
  private_key = settings.server_private_key
  contract_address = settings.contract_address
  server_wallet = settings.server_wallet_address.lower() if settings.server_wallet_address else ""

  if not (rpc_url and private_key and contract_address and server_wallet):
    raise HTTPException(status_code=500, detail="Blockchain credentials are not configured")

  derived_address = Account.from_key(private_key).address.lower()
  if derived_address != server_wallet:
    raise HTTPException(status_code=500, detail="Server wallet address mismatch with private key")

  cmd = [
    "node",
    str(ETHERS_RUNNER),
    "mint",
    rpc_url,
    private_key,
    contract_address,
    to_address,
    token_uri,
  ]

  try:
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
  except FileNotFoundError as exc:
    raise HTTPException(status_code=500, detail="Node.js runtime is not available") from exc
  except subprocess.CalledProcessError as exc:  # pragma: no cover - external process
    detail = exc.stderr.strip() or "Mint transaction failed"
    raise HTTPException(status_code=502, detail=detail) from exc

  try:
    payload = json.loads(result.stdout.strip() or "{}")
  except json.JSONDecodeError as exc:
    raise HTTPException(status_code=502, detail="Invalid mint response") from exc

  return payload
