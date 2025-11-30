const randomHex = () => {
  const uuid = crypto.randomUUID().replace(/-/g, "")
  return `0x${uuid}`
}

export async function mintAuthenticityNFT(_: {
  cid: string
  metadata: Record<string, unknown>
  payload: Record<string, unknown>
}) {
  // TODO: Replace with actual contract call using the connected Web3Auth wallet.
  return {
    tokenId: randomHex(),
    txHash: randomHex(),
  }
}

export async function transferAuthenticityNFT(_: {
  tokenId: string
  fromWallet: string
  toWallet: string
}) {
  // TODO: Replace with an on-chain transfer using the connected wallet.
  return {
    txHash: randomHex(),
  }
}
