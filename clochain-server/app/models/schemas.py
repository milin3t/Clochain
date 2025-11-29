from pydantic import BaseModel, EmailStr, Field


class EmailRequestPayload(BaseModel):
  email: EmailStr


class EmailVerifyPayload(BaseModel):
  email: EmailStr
  code: str = Field(min_length=6, max_length=6)


class EmailVerifyResponse(BaseModel):
  sessionJWT: str = Field(..., alias="sessionJWT")
  did: str

  model_config = {"populate_by_name": True}


class IssueRequest(BaseModel):
  brand: str
  productId: str
  purchaseAt: str


class IssueResponse(BaseModel):
  issueId: str
  q: str
  qrBase64: str


class IssuePayload(BaseModel):
  brand: str
  productId: str
  purchaseAt: str
  did: str
  nonce: str
  signature: str
