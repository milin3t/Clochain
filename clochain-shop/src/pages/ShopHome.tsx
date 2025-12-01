import BrandCard from '../components/BrandCard'
import Button from '../components/Button'
import { brandCatalog } from '../data/brands'
import { useAuth } from '../context/AuthContext'
import { shortenAddress } from '../api/auth'

const ShopHome = () => {
  const { walletAddress, login, logout } = useAuth()

  return (
    <section className="space-y-12">
      <header className="space-y-5 text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-gray-500">CloChain 매장 Access</p>
        <h1 className="text-3xl sm:text-5xl text-ink">Luxury Authentication Suite</h1>
        <p className="mx-auto max-w-2xl text-sm text-gray-600">
          QR issuance and verification for Celine, Chloe, and MiuMiu. Discover curated items,
          register provenance, and prepare for on-chain ownership transfers.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {walletAddress ? (
            <Button
              as="button"
              type="button"
              variant="muted"
              onClick={logout}
              className="text-[0.65rem]"
            >
              {shortenAddress(walletAddress)} 로그아웃
            </Button>
          ) : (
            <Button as="button" type="button" onClick={login} variant="primary">
              이메일로 지갑 로그인
            </Button>
          )}
          <Button as="a" href="/shop/verify" variant="muted">
            정품 인증 검증하기
          </Button>
        </div>
      </header>
      <div className="grid gap-6 md:grid-cols-3">
        {brandCatalog.map((brand) => (
          <BrandCard key={brand.slug} brand={brand} />
        ))}
      </div>
    </section>
  )
}

export default ShopHome
