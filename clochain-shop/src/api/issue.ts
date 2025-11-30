import axios from 'axios'
import type { IssueRequest, IssueResponse } from '../types/issue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.error('VITE_API_BASE_URL is not set. Please define it in your .env file.')
}

const client = axios.create({
  baseURL: API_BASE_URL,
})

export async function issueProduct(
  payload: IssueRequest,
  walletAddress: string,
): Promise<IssueResponse> {
  if (!walletAddress) {
    throw new Error('WALLET_REQUIRED')
  }

  const body: IssueRequest = {
    ...payload,
    ownerWallet: walletAddress,
  }

  const { data } = await client.post<IssueResponse>('/issue', body, {
    headers: {
      Authorization: `Bearer ${walletAddress}`,
    },
  })

  return data
}
