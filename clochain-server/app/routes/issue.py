from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.db.session import get_session
from app.services.issue_service import IssueService

router = APIRouter()


class IssueRequest(BaseModel):
  brand: str
  productId: str = Field(alias="productId")
  purchaseAt: str = Field(alias="purchaseAt")
  ownerWallet: str = Field(alias="ownerWallet")

  model_config = {"populate_by_name": True}


@router.post("/issue")
def issue_qr(payload: IssueRequest, session=Depends(get_session)):
  service = IssueService(session)
  response = service.issue(payload.model_dump(by_alias=True))
  return response
