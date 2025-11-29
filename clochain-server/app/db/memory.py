from __future__ import annotations

import hmac
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional


def _now() -> datetime:
  return datetime.now(tz=timezone.utc)


@dataclass
class EmailVerification:
  email: str
  code: str
  expires_at: datetime

  def is_expired(self) -> bool:
    return _now() >= self.expires_at


@dataclass
class IssueRecord:
  issue_id: str
  short_token: str
  payload: Dict[str, str]
  signature: str
  created_at: datetime = field(default_factory=_now)


class InMemoryDB:
  def __init__(self) -> None:
    self.email_codes: Dict[str, EmailVerification] = {}
    self.issues: Dict[str, IssueRecord] = {}

  def upsert_email_code(self, email: str, code: str, ttl_minutes: int = 10) -> EmailVerification:
    record = EmailVerification(email=email, code=code, expires_at=_now() + timedelta(minutes=ttl_minutes))
    self.email_codes[email.lower()] = record
    return record

  def verify_email_code(self, email: str, code: str) -> bool:
    record = self.email_codes.get(email.lower())
    if not record:
      return False
    if record.is_expired():
      return False
    return hmac.compare_digest(code, record.code)

  def consume_email_code(self, email: str) -> None:
    self.email_codes.pop(email.lower(), None)

  def store_issue(self, issue: IssueRecord) -> IssueRecord:
    self.issues[issue.short_token] = issue
    return issue

  def get_issue_by_short_token(self, short_token: str) -> Optional[IssueRecord]:
    return self.issues.get(short_token)
db = InMemoryDB()
