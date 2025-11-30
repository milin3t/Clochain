let currentWalletAddress: string | null = null

export const authSession = {
  setWalletAddress(address?: string | null) {
    currentWalletAddress = address ? address.toLowerCase() : null
  },
  getWalletAddress(): string | null {
    return currentWalletAddress
  },
  getDid(): string | null {
    return currentWalletAddress ? `did:ethr:${currentWalletAddress}` : null
  },
}

export const shortenAddress = (address?: string | null) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const getWalletAddress = () => authSession.getWalletAddress()
