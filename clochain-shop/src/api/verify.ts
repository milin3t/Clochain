import axios from 'axios'
import type { VerifyRequest, VerifyResponse } from '../types/verify'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  console.warn('VITE_API_BASE_URL is not defined. /verify requests will fail.')
}

const client = axios.create({
  baseURL: API_BASE_URL,
})

type VerifyResponseRaw = Partial<VerifyResponse> & {
  valid?: boolean
}

export async function verifyProduct(params: VerifyRequest): Promise<VerifyResponse> {
  const requestParams: Record<string, string> = { q: params.token }
  if (params.sig) {
    requestParams.sig = params.sig
  }
  const { data } = await client.get<VerifyResponseRaw>('/verify', {
    params: requestParams,
  })
  const ok =
    typeof data.ok === 'boolean'
      ? data.ok
      : typeof data.valid === 'boolean'
        ? data.valid
        : false
  return {
    ok,
    reason: data.reason,
    payload: data.payload,
    signature: data.signature,
    registered: data.registered,
  }
}
