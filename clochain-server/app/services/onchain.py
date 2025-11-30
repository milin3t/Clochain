from functools import lru_cache

from eth_account import Account
from fastapi import HTTPException
from web3 import Web3
from web3.contract.contract import Contract
from web3.exceptions import ContractLogicError, Web3Exception
from web3._utils.events import EventLogErrorFlags
from web3._utils.events import EventLogErrorFlags

from app.core.config import settings

ABI = [
  {
    "anonymous": False,
    "inputs": [
      {"indexed": True, "internalType": "address", "name": "from", "type": "address"},
      {"indexed": True, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": True, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
    ],
    "name": "Transfer",
    "type": "event",
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "bytes32", "name": "productHash", "type": "bytes32"},
      {"internalType": "string", "name": "tokenURI", "type": "string"},
    ],
    "name": "mintAuthenticityToken",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function",
  },
]


@lru_cache
def _init_web3() -> tuple[Web3, Contract, str]:
  if not all(
    [
      settings.rpc_url,
      settings.server_private_key,
      settings.server_wallet_address,
      settings.contract_address,
    ]
  ):
    raise HTTPException(status_code=500, detail="Blockchain credentials are not configured")

  w3 = Web3(Web3.HTTPProvider(settings.rpc_url, request_kwargs={"timeout": 30}))
  if not w3.is_connected():
    raise HTTPException(status_code=502, detail="RPC connection failed")

  account = Account.from_key(settings.server_private_key)
  expected = settings.server_wallet_address.lower()
  actual = account.address.lower()
  if expected != actual:
    raise HTTPException(status_code=500, detail="Server wallet address mismatch")

  contract = w3.eth.contract(
    address=Web3.to_checksum_address(settings.contract_address),
    abi=ABI,
  )
  return w3, contract, account.address


def mint_via_web3(to_address: str, token_uri: str, product_hash_source: str) -> dict:
  if not token_uri:
    raise HTTPException(status_code=400, detail="tokenURI is required")
  if not product_hash_source:
    raise HTTPException(status_code=400, detail="product hash source is required")

  w3, contract, server_address = _init_web3()
  checksum_to = _to_checksum(to_address)
  product_hash = Web3.keccak(text=product_hash_source)

  txn = contract.functions.mintAuthenticityToken(checksum_to, product_hash, token_uri).build_transaction(
    {
      "from": server_address,
      "nonce": w3.eth.get_transaction_count(server_address),
      "gasPrice": w3.eth.gas_price,
    }
  )

  if "gas" not in txn:
    try:
      txn["gas"] = contract.functions.mintAuthenticityToken(checksum_to, product_hash, token_uri).estimate_gas(
        {"from": server_address}
      )
    except Web3Exception:
      txn["gas"] = 500_000

  try:
    signed = Account.from_key(settings.server_private_key).sign_transaction(txn)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
  except (ContractLogicError, Web3Exception) as exc:  # noqa: BLE001
    raise HTTPException(status_code=502, detail="Mint transaction failed") from exc

  token_id = _extract_token_id(contract, receipt)
  if token_id is None:
    raise HTTPException(status_code=500, detail="Unable to extract tokenId from receipt")

  return {
    "txHash": tx_hash.hex(),
    "blockNumber": receipt.get("blockNumber"),
    "tokenId": str(token_id),
  }


def _to_checksum(address: str) -> str:
  try:
    return Web3.to_checksum_address(address)
  except ValueError as exc:
    raise HTTPException(status_code=400, detail="Invalid wallet address") from exc


def _extract_token_id(contract: Contract, receipt: dict) -> int | None:
  try:
    discard_flag = getattr(EventLogErrorFlags, "DISCARD", None)
    if discard_flag is not None:
      events = contract.events.Transfer().process_receipt(receipt, errors=discard_flag)
    else:
      events = contract.events.Transfer().process_receipt(receipt)
  except Web3Exception:
    events = []
  if events:
    return int(events[0]["args"]["tokenId"])
  return None
