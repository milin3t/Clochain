import uuid
from datetime import datetime
from typing import Any, Dict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.did import did_to_wallet, to_did
from app.db import models


def ensure_user(session: Session, wallet_address: str) -> models.User:
  wallet = wallet_address.lower()
  result = session.execute(select(models.User).where(models.User.wallet_address == wallet))
  user = result.scalars().first()
  if user:
    return user
  user = models.User(wallet_address=wallet, did=to_did(wallet))
  session.add(user)
  session.commit()
  return user


def create_issue(session: Session, short_token: str, payload: Dict[str, Any], signature: str) -> models.Issue:
  issue = models.Issue(
    issue_id=str(uuid.uuid4()),
    short_token=short_token,
    payload=payload,
    signature=signature,
    created_at=datetime.utcnow(),
  )
  session.add(issue)
  session.commit()
  return issue


def get_issue_by_token(session: Session, short_token: str) -> models.Issue | None:
  result = session.execute(select(models.Issue).where(models.Issue.short_token == short_token))
  return result.scalars().first()


def create_nft_record(
  session: Session,
  token_id: str,
  wallet_address: str,
  cid: str,
  payload: Dict[str, Any],
  first_owner_wallet: str | None = None,
):
  wallet = wallet_address.lower()
  first_owner = (first_owner_wallet or did_to_wallet(payload["did"])).lower()
  nft = models.NFT(
    token_id=token_id,
    owner_wallet=wallet,
    cid=cid,
    brand=payload["brand"],
    product_id=payload["productId"],
    purchase_at=payload["purchaseAt"],
    first_owner_wallet=first_owner,
    created_at=datetime.utcnow(),
  )
  session.add(nft)
  session.commit()
  return nft


def get_nft_by_token(session: Session, token_id: str) -> models.NFT | None:
  result = session.execute(select(models.NFT).where(models.NFT.token_id == token_id))
  return result.scalars().first()


def is_payload_registered(session: Session, payload: Dict[str, Any]) -> bool:
  stmt = select(models.NFT).where(
    models.NFT.brand == payload["brand"],
    models.NFT.product_id == payload["productId"],
    models.NFT.purchase_at == payload["purchaseAt"],
  )
  result = session.execute(stmt)
  return result.scalars().first() is not None


def update_nft_owner(session: Session, token_id: str, to_wallet: str) -> models.NFT | None:
  nft = get_nft_by_token(session, token_id)
  if not nft:
    return None
  nft.owner_wallet = to_wallet
  session.commit()
  session.refresh(nft)
  return nft


def record_transfer(
  session: Session,
  token_id: str,
  from_wallet: str,
  to_wallet: str,
  tx_hash: str,
  block_number: int | None = None,
) -> models.Transfer:
  transfer = models.Transfer(
    id=str(uuid.uuid4()),
    token_id=token_id,
    from_wallet=from_wallet,
    to_wallet=to_wallet,
    tx_hash=tx_hash,
    block_number=block_number,
  )
  session.add(transfer)
  session.commit()
  return transfer


def store_session(session: Session, token: str, wallet_address: str, expired_at: datetime) -> models.Session:
  record = models.Session(session_token=token, wallet_address=wallet_address.lower(), expired_at=expired_at)
  session.merge(record)
  session.commit()
  return record


def list_nfts_by_owner(session: Session, wallet_address: str) -> list[models.NFT]:
  wallet = wallet_address.lower()
  stmt = select(models.NFT).where(models.NFT.owner_wallet == wallet)
  result = session.execute(stmt)
  return list(result.scalars().all())
