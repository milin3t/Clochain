from fastapi import HTTPException, status


def to_did(wallet_address: str) -> str:
  wallet = wallet_address.lower()
  if not wallet.startswith("0x") or len(wallet) < 6:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid wallet address")
  return f"did:ethr:{wallet}"


def did_to_wallet(did: str) -> str:
  prefix = "did:ethr:"
  if not did.startswith(prefix):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid DID format")
  wallet = did[len(prefix) :].lower()
  if not wallet.startswith("0x"):
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid wallet in DID")
  return wallet
