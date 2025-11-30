import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  console.error('VITE_API_BASE_URL is not configured. NFT APIs will fail.')
}

const client = axios.create({
  baseURL: API_BASE_URL,
})

const authHeader = (sessionToken: string) => ({
  Authorization: `Bearer ${sessionToken}`,
})

export interface NFTItem {
  tokenId: string
  brand: string
  productId: string
  tokenURI?: string
}

export interface TransferRecordResponse {
  ok: boolean
  txHash: string
}

export interface RegisterResponse {
  ok: boolean
  tokenId: string
  cid: string
  metadata: Record<string, unknown>
  txHash?: string
  blockNumber?: number | null
}

export async function registerNFT(shortToken: string, sessionToken: string) {
  const { data } = await client.post<RegisterResponse>(
    '/nft/register',
    { short_token: shortToken },
    { headers: authHeader(sessionToken) },
  )
  return data
}

export async function recordNFTTransfer(
  payload: {
    tokenId: string
    fromWallet: string
    toWallet: string
    txHash: string
    blockNumber?: number | null
  },
  sessionToken: string,
) {
  const { data } = await client.post<TransferRecordResponse>(
    '/nft/record-transfer',
    payload,
    { headers: authHeader(sessionToken) },
  )
  return data
}

export async function fetchMyNFTs(sessionToken: string) {
  const { data } = await client.get<NFTItem[]>('/nft/me', {
    headers: authHeader(sessionToken),
  })
  return data
}
