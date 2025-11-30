from datetime import datetime
from typing import Any, Dict

from sqlalchemy import JSON, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
  pass


class User(Base):
  __tablename__ = "users"

  wallet_address: Mapped[str] = mapped_column(String, primary_key=True)
  did: Mapped[str] = mapped_column(String, nullable=False)
  created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Issue(Base):
  __tablename__ = "issues"

  issue_id: Mapped[str] = mapped_column(String, primary_key=True)
  short_token: Mapped[str] = mapped_column(String, unique=True, nullable=False)
  payload: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
  signature: Mapped[str] = mapped_column(String, nullable=False)
  owner_wallet: Mapped[str] = mapped_column(String, nullable=False)


class NFT(Base):
  __tablename__ = "nfts"

  token_id: Mapped[str] = mapped_column(String, primary_key=True)
  owner_wallet: Mapped[str] = mapped_column(String, nullable=False)
  token_uri: Mapped[str] = mapped_column(Text, nullable=False)
  brand: Mapped[str] = mapped_column(String, nullable=False)
  product_id: Mapped[str] = mapped_column(String, nullable=False)
  purchase_at: Mapped[str] = mapped_column(String, nullable=False)
  first_owner_wallet: Mapped[str] = mapped_column(String, nullable=False)
  first_owner_did: Mapped[str] = mapped_column(String, nullable=False)


class Transfer(Base):
  __tablename__ = "transfers"

  id: Mapped[str] = mapped_column(String, primary_key=True)
  token_id: Mapped[str] = mapped_column(String, ForeignKey("nfts.token_id"), nullable=False)
  from_wallet: Mapped[str] = mapped_column(String, nullable=False)
  to_wallet: Mapped[str] = mapped_column(String, nullable=False)
  tx_hash: Mapped[str] = mapped_column(String, nullable=False)
  created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
