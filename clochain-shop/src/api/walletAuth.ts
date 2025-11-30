import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  console.error('VITE_API_BASE_URL is not configured. Wallet DID auth will fail.')
}

const client = axios.create({
  baseURL: API_BASE_URL,
})

interface WalletNonceResponse {
  wallet: string
  nonce: string
}

interface WalletVerifyResponse {
  access_token: string
  did: string
}

export async function requestWalletNonce(walletAddress: string): Promise<WalletNonceResponse> {
  const { data } = await client.post<WalletNonceResponse>('/auth/wallet/request', {
    walletAddress,
  })
  return data
}

export async function verifyWalletSignature(
  walletAddress: string,
  signature: string,
): Promise<WalletVerifyResponse> {
  const { data } = await client.post<WalletVerifyResponse>('/auth/wallet/verify', {
    walletAddress,
    signature,
  })
  return data
}
