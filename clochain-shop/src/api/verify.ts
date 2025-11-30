import axios from 'axios'
import type { VerifyRequest, VerifyResponse } from '../types/verify'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.warn('VITE_API_BASE_URL is not defined. /verify requests will fail.')
}

const client = axios.create({
  baseURL: API_BASE_URL,
})

export async function verifyProduct(params: VerifyRequest): Promise<VerifyResponse> {
  const { data } = await client.get<VerifyResponse>('/verify', {
    params: {
      token: params.token,
      sig: params.sig,
    },
  })
  return data
}
