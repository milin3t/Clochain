import BrandCard from '../components/BrandCard'
import Button from '../components/Button'
import LoginButton from '../components/LoginButton'
import { brandCatalog } from '../data/brands'

const ShopHome = () => {
  return (
    <section className="space-y-12">
      <header className="space-y-5 text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-gray-500">CloChain Maison Access</p>
        <h1 className="text-3xl sm:text-5xl text-ink">Luxury Authentication Suite</h1>
        <p className="mx-auto max-w-2xl text-sm text-gray-600">
          QR issuance and verification for Celine, Chloe, and MiuMiu. Discover curated items,
          register provenance, and prepare for on-chain ownership transfers.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button as="a" href="/shop/login" variant="primary">
            Partner Login
          </Button>
          <Button as="a" href="/shop/verify" variant="muted">
            Verify Authenticity
          </Button>
        </div>
        <LoginButton />
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
