export const shortenAddress = (address?: string | null, chars = 4) => {
  if (!address) return ''
  const prefix = address.slice(0, chars + 2)
  const suffix = address.slice(-chars)
  return `${prefix}…${suffix}`
}
