import { Link, useParams } from 'react-router-dom'
import Button from '../components/Button'
import { findBrand, findProduct } from '../data/brands'

const ProductPage = () => {
  const { brand: brandSlug, productId } = useParams<{ brand?: string; productId?: string }>()
  const brand = brandSlug ? findBrand(brandSlug) : undefined
  const product = brand && productId ? findProduct(brandSlug, productId) : null

  if (!brand || !product) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-gray-500">상품을 찾을 수 없습니다.</p>
        <Button as={Link} to={`/shop/${brandSlug || ''}`} variant="muted">
          Back to collection
        </Button>
      </div>
    )
  }

  return (
    <section className="grid gap-10 md:grid-cols-2">
      <div className="flex min-h-[360px] items-center justify-center rounded-[32px] border border-white/40 bg-gradient-to-br from-beige to-sand text-sm uppercase tracking-[0.6em] text-gray-500">
        NO IMAGE
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.5em] text-gray-500">{brand.name}</p>
          <h2 className="text-4xl tracking-[0.3em]">{product.name}</h2>
          <p className="text-sm text-gray-600">{product.description}</p>
        </div>
        <div className="text-sm uppercase tracking-[0.5em] text-ink">{product.price}</div>
        <div className="rounded-[24px] border border-ink/10 bg-white/60 p-6 text-sm text-gray-600">
          Self-registration ready. QR issuance will mint proof-of-origin NFT once linked to the
          CloChain server.
        </div>
        <Button type="button" className="w-full md:w-auto">
          PURCHASE
        </Button>
        <Button as={Link} to={`/shop/${brand.slug}`} variant="muted">
          Back to {brand.name}
        </Button>
      </div>
    </section>
  )
}

export default ProductPage
