export interface VerifyRequest {
  token: string
  sig?: string
}

export interface VerifyResponse {
  ok: boolean
  reason?: string
  payload?: Record<string, unknown>
  signature?: string
}
