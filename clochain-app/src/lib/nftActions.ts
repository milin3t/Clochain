import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  sendTransaction,
  waitForReceipt,
} from 'thirdweb'
import { polygonAmoy } from 'thirdweb/chains'
import type { Account } from 'thirdweb/wallets'

const CLOCHAIN_ABI = [
  {
    type: 'function',
    name: 'transferFrom',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
] as const

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS
const TW_CLIENT_ID = import.meta.env.VITE_TW_CLIENT_ID

const getClient = (() => {
  let cached: ReturnType<typeof createThirdwebClient> | null = null
  return () => {
    if (cached) return cached
    if (!TW_CLIENT_ID) {
      throw new Error('VITE_TW_CLIENT_ID is not configured')
    }
    cached = createThirdwebClient({ clientId: TW_CLIENT_ID })
    return cached
  }
})()

export async function transferAuthenticityNFT({
  tokenId,
  fromWallet,
  toWallet,
  account,
}: {
  tokenId: string
  fromWallet: string
  toWallet: string
  account: Account | null | undefined
}) {
  if (!account) {
    throw new Error('WALLET_REQUIRED')
  }
  if (!CONTRACT_ADDRESS) {
    throw new Error('VITE_CONTRACT_ADDRESS is not configured')
  }
  const normalizedFrom = fromWallet.toLowerCase()
  const normalizedAccount = account.address.toLowerCase()
  if (normalizedFrom !== normalizedAccount) {
    throw new Error('WALLET_MISMATCH')
  }
  let tokenIdValue: bigint
  try {
    tokenIdValue = BigInt(tokenId)
  } catch {
    throw new Error('INVALID_TOKEN_ID')
  }
  const client = getClient()
  const contract = getContract({
    client,
    chain: polygonAmoy,
    address: CONTRACT_ADDRESS,
    abi: CLOCHAIN_ABI,
  })
  const transaction = prepareContractCall({
    contract,
    method: 'transferFrom',
    params: [account.address, toWallet, tokenIdValue],
  })
  const { transactionHash } = await sendTransaction({
    account,
    transaction,
  })
  const receipt = await waitForReceipt({ client, chain: polygonAmoy, transactionHash })
  return {
    txHash: transactionHash,
    blockNumber: receipt?.blockNumber ? Number(receipt.blockNumber) : null,
  }
}
