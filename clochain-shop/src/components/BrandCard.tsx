import { Link } from 'react-router-dom'
import Button from './Button'
import type { Brand } from '../data/brands'

type BrandCardProps = {
  brand: Brand
}

const BrandCard = ({ brand }: BrandCardProps) => {
  return (
    <article className="flex flex-col overflow-hidden rounded-[28px] border border-white/40 bg-white/70 shadow-subtle backdrop-blur">
      <div className="relative flex h-60 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-beige to-sand text-center text-xs uppercase tracking-[0.6em] text-gray-500">
        NO IMAGE
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-gray-400">{brand.origin}</p>
          <h3 className="text-2xl tracking-[0.4em]">{brand.name}</h3>
        </div>
        <p className="text-sm text-gray-600">{brand.description}</p>
        <Button as={Link} to={`/shop/${brand.slug}`} variant="primary">
          View Maison
        </Button>
      </div>
    </article>
  )
}

export default BrandCard
