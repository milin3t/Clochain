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

export interface MetadataResponse {
  cid: string
  metadata: Record<string, unknown>
  payload: Record<string, unknown>
}

export interface RecordResponse {
  ok: boolean
  tokenId: string
  walletAddress: string
  cid: string
}

export interface TransferRecordResponse {
  ok: boolean
  txHash: string
}

export async function buildNFTMetadata(shortToken: string) {
  const { data } = await client.post<MetadataResponse>('/nft/metadata', {
    short_token: shortToken,
  })
  return data
}

export async function recordNFTMint(
  payload: {
    tokenId: string
    walletAddress: string
    cid: string
    payload: Record<string, unknown>
  },
  sessionToken: string,
) {
  const { data } = await client.post<RecordResponse>(
    '/nft/record',
    payload,
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
