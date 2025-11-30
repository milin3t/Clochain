import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  console.error('VITE_API_BASE_URL is not configured. NFT APIs will fail.')
}

const client = axios.create({
  baseURL: API_BASE_URL,
})

export interface NFTItem {
  tokenId: string
  brand: string
  productId: string
  tokenURI?: string
}

export interface RegisterNFTResponse {
  tokenId?: string
  cid?: string
  message?: string
  ok?: boolean
}

export interface TransferResponse {
  txHash?: string
  ok?: boolean
}

const authHeader = (walletAddress: string) => ({
  Authorization: `Bearer ${walletAddress}`,
})

export async function registerNFT(shortToken: string, walletAddress: string) {
  const { data } = await client.post<RegisterNFTResponse>(
    '/nft/register',
    { q: shortToken },
    { headers: authHeader(walletAddress) },
  )
  return data
}

export async function fetchMyNFTs(walletAddress: string) {
  const { data } = await client.get<NFTItem[]>('/nft/me', {
    headers: authHeader(walletAddress),
  })
  return data
}

export async function transferNFT(tokenId: string, to: string, walletAddress: string) {
  const { data } = await client.post<TransferResponse>(
    '/nft/transfer',
    { tokenId, to },
    { headers: authHeader(walletAddress) },
  )
  return data
}
