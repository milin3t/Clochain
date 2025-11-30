export interface IssueRequest {
  product_type: string
}

export interface IssueResponse {
  short_token: string
  payload: Record<string, unknown>
  signature: string
  qr_base64: string
  stale?: boolean
}
