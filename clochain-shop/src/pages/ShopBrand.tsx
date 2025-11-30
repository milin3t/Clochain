import { useEffect } from 'react'
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import { shortenAddress } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import Button from '../components/Button'
import { findBrand } from '../data/brands'

const ShopBrand = () => {
  const { brand: brandSlug } = useParams<{ brand?: string }>()
  const brand = brandSlug ? findBrand(brandSlug) : undefined
  const { walletAddress } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!walletAddress) {
      navigate('/shop/login', { replace: true, state: { from: location.pathname } })
    }
  }, [walletAddress, location.pathname, navigate])

  if (!walletAddress) {
    return null
  }

  if (!brand) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-gray-500">요청하신 브랜드를 찾을 수 없습니다.</p>
        <Button as={Link} to="/shop" variant="muted">
          Back to shop
        </Button>
      </div>
    )
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-end">
        {walletAddress && (
          <div className="rounded-full border border-white/60 bg-white/70 px-4 py-2 text-right text-[10px] uppercase tracking-[0.3em] text-gray-500">
            <p className="text-[10px]">Connected Wallet</p>
            <p className="font-mono text-sm text-ink">{shortenAddress(walletAddress)}</p>
          </div>
        )}
      </div>
      <div className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-gray-500">Maison Collection</p>
        <h2 className="text-4xl tracking-[0.4em]">{brand.name}</h2>
        <p className="mx-auto max-w-2xl text-sm text-gray-600">{brand.narrative}</p>
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
          상품 상세의 PURCHASE 버튼에서 즉시 QR을 발급할 수 있습니다.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button as={Link} to="/shop/verify" variant="muted">
            정품 인증 검증하기
          </Button>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {brand.products.map((product) => (
          <ProductCard key={product.id} product={product} brandSlug={brand.slug} />
        ))}
      </div>
    </section>
  )
}

export default ShopBrand
