interface NFTCardProps {
  nft: {
    tokenId: string
    brand: string
    productId: string
    tokenURI?: string
  }
  onClick?: () => void
}

const brandColors = ['#312e81', '#581c87', '#1f2937', '#0f172a']

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
      className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-left shadow-[0_20px_45px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 hover:border-white/20"
    >
      <div
        className="h-40 w-full rounded-xl border border-white/5"
        style={{ background: `linear-gradient(135deg, ${pickBrandColor(nft.brand)}, #111827)` }}
      />
      <p className="mt-4 text-sm font-semibold text-slate-400">#{nft.tokenId}</p>
      <p className="text-lg font-semibold text-white">{name}</p>
    </button>
  )
}

export default NFTCard
