export interface NFTMetadata {
  name?: string
  description?: string
  image?: string
  external_url?: string
  attributes?: Array<{ trait_type: string; value: string }>
  [key: string]: unknown
}

const defaultGateway = 'https://ipfs.io'

export const resolveIPFSUrl = (uri?: string) => {
  if (!uri) return undefined
  if (!uri.startsWith('ipfs://')) return uri
  const gateway = import.meta.env.VITE_IPFS_GATEWAY ?? defaultGateway
  const path = uri.replace('ipfs://', '')
  return `${gateway.replace(/\/$/, '')}/ipfs/${path}`
}

export const fetchMetadata = async (tokenURI?: string): Promise<NFTMetadata | null> => {
  const resolved = resolveIPFSUrl(tokenURI)
  if (!resolved) return null
  try {
    const response = await fetch(resolved)
    if (!response.ok) return null
    const data = (await response.json()) as NFTMetadata
    if (data.image) {
      data.image = resolveIPFSUrl(data.image)
    }
    return data
  } catch (error) {
    console.warn('Failed to load metadata', error)
    return null
  }
}
