import { useParams, Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Button from '../components/Button'
import { findBrand } from '../data/brands'

const ShopBrand = () => {
  const { brand: brandSlug } = useParams<{ brand?: string }>()
  const brand = brandSlug ? findBrand(brandSlug) : undefined

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
      <div className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.5em] text-gray-500">Maison Collection</p>
        <h2 className="text-4xl tracking-[0.4em]">{brand.name}</h2>
        <p className="mx-auto max-w-2xl text-sm text-gray-600">{brand.narrative}</p>
        <div className="flex justify-center">
          <Button as={Link} to={`/shop/${brand.slug}/issue`}>
            정품 QR 발급하기
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
