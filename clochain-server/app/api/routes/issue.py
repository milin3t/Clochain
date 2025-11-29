import base64
import uuid
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_session
from app.core.security import generate_nonce, generate_short_token, sign_issue_payload
from app.db.memory import IssueRecord, db
from app.models.schemas import IssuePayload, IssueRequest, IssueResponse

router = APIRouter()


@router.post("/issue", response_model=IssueResponse)
async def issue_qr(request: IssueRequest, session: dict = Depends(get_current_session)) -> IssueResponse:
  did = session.get("did")
  if not did:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing DID in session")

  base_payload = {
    "brand": request.brand,
    "productId": request.productId,
    "purchaseAt": request.purchaseAt,
    "did": did,
    "nonce": generate_nonce(),
  }
  signature = sign_issue_payload(base_payload)
  payload = IssuePayload(**base_payload, signature=signature)

  short_token = generate_short_token()
  issue_id = str(uuid.uuid4())
  db.store_issue(
    IssueRecord(
      issue_id=issue_id,
      short_token=short_token,
      payload=payload.model_dump(),
      signature=signature,
    )
  )

  qr_value = f"/shop/verify?q={short_token}"
  qr_base64 = base64.b64encode(qr_value.encode()).decode()

  return IssueResponse(issueId=issue_id, q=short_token, qrBase64=f"data:text/plain;base64,{qr_base64}")
