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
  product_type: str = Field(..., alias="product_type")


class IssuePayload(BaseModel):
  issuer: EmailStr
  product_type: str
  timestamp: int
  nonce: str


class IssueResponse(BaseModel):
  short_token: str
  payload: IssuePayload
  signature: str
  qr_base64: str = Field(..., alias="qr_base64")

  model_config = {"populate_by_name": True}
