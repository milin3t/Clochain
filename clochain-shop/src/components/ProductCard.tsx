import { Link } from 'react-router-dom'
import type { Product } from '../data/brands'

type ProductCardProps = {
  product: Product
  brandSlug: string
}

const ProductCard = ({ product, brandSlug }: ProductCardProps) => {
  return (
    <Link
      to={`/shop/${brandSlug}/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-[24px] border border-white/40 bg-white/80 shadow-subtle"
    >
      <div className="flex h-56 items-center justify-center bg-gradient-to-br from-beige to-sand text-xs uppercase tracking-[0.6em] text-gray-500">
        NO IMAGE
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-xs uppercase tracking-[0.4em] text-gray-500">{product.code}</p>
        <h4 className="text-lg tracking-[0.25em]">{product.name}</h4>
        <p className="text-sm text-gray-600">{product.description}</p>
        <div className="mt-auto pt-4 text-sm tracking-[0.3em] text-ink">
          {product.price}
        </div>
      </div>
    </Link>
  )
}

export default ProductCard
