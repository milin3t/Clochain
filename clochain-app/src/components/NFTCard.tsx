interface NFTCardProps {
  nft: {
    tokenId: string
    brand: string
    productId: string
    tokenURI?: string
  }
  onClick?: () => void
}

const brandColors = ['#E0E7FF', '#FFE4E6', '#FEF9C3', '#DCFCE7']

const pickBrandColor = (brand: string) => {
  if (!brand) return brandColors[0]
  const code = brand
    .split('')
    .map((char) => char.charCodeAt(0))
    .reduce((acc, val) => acc + val, 0)
  return brandColors[code % brandColors.length]
}

const NFTCard = ({ nft, onClick }: NFTCardProps) => {
  const name = `${nft.brand} ${nft.productId}`
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5"
    >
      <div className="h-40 w-full rounded-xl" style={{ backgroundColor: pickBrandColor(nft.brand) }} />
      <p className="mt-4 text-sm font-semibold text-black/60">#{nft.tokenId}</p>
      <p className="text-lg font-semibold text-[#111]">{name}</p>
    </button>
  )
}

export default NFTCard
