import { useEffect } from 'react'
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import { shortenAddress } from '../api/auth'
import { useAuth } from '../auth/useAuth'
import ProductCard from '../components/ProductCard'
import Button from '../components/Button'
import { findBrand } from '../data/brands'

const ShopBrand = () => {
  const { brand: brandSlug } = useParams<{ brand?: string }>()
  const brand = brandSlug ? findBrand(brandSlug) : undefined
  const { walletAddress, isAuthenticated, isInitializing } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate('/shop/login', { replace: true, state: { from: location.pathname } })
    }
  }, [isAuthenticated, isInitializing, location.pathname, navigate])

  if (isInitializing) {
    return (
      <div className="rounded-[32px] border border-white/20 bg-white/70 p-8 text-center text-sm text-gray-600">
        Web3Auth 세션을 확인하는 중입니다...
      </div>
    )
  }

  if (!isAuthenticated) {
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
        {isAuthenticated && walletAddress && (
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
        <div className="flex flex-wrap justify-center gap-3">
          <Button as={Link} to={`/shop/${brand.slug}/issue`}>
            정품 QR 발급하기
          </Button>
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
