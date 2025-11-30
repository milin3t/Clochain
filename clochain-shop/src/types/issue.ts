export interface IssueRequest {
  brand: string
  productId: string
  purchaseAt: string
  ownerWallet?: string
}

export interface IssuePayload {
  brand: string
  productId: string
  purchaseAt: string
  did: string
  nonce: string
  issuedAt: string
}

export interface IssueResponse {
  short_token: string
  payload: IssuePayload
  signature: string
  qr_base64: string
}
