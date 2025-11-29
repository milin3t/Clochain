export type Product = {
  id: string
  code: string
  name: string
  description: string
  price: string
  image: string
}

export type Brand = {
  slug: string
  name: string
  origin: string
  description: string
  heroImage: string
  narrative: string
  products: Product[]
}

export const brandCatalog: Brand[] = [
  {
    slug: 'celine',
    name: 'Celine',
    origin: 'Paris, 1945',
    description:
      'Architectural tailoring and quiet-luxury accessories for refined wardrobes.',
    heroImage:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=80',
    narrative:
      'Celine ateliers archive each silhouette with CloChain to certify pieces beyond seasons.',
    products: [
      {
        id: 'ct-001',
        code: 'Triomphe',
        name: 'Triomphe Canvas Tote',
        description: 'Natural calfskin with brushed Triomphe emblem and suede lining.',
        price: '₩ 3,200,000',
        image:
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'ct-002',
        code: 'Maillon',
        name: 'Maillon Supple Shoulder',
        description: 'Supple lambskin bag with sculpted hardware for day-to-evening transitions.',
        price: '₩ 4,150,000',
        image:
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'ct-003',
        code: 'Blazon',
        name: 'Blazon Calfskin Loafers',
        description: 'Hand-finished loafers with saddle strap and tone-on-tone stitching.',
        price: '₩ 1,150,000',
        image:
          'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
  {
    slug: 'chloe',
    name: 'Chloe',
    origin: 'Paris, 1952',
    description: 'Soft silhouettes and luminous palettes with artisanal finishes.',
    heroImage:
      'https://images.unsplash.com/photo-1508427953056-b00b8d78ebca?auto=format&fit=crop&w=1600&q=80',
    narrative:
      'Bohemian craft meets cryptographic trust—Chloe uses CloChain for effortless verification.',
    products: [
      {
        id: 'ch-201',
        code: 'Marcie',
        name: 'Marcie Saddle Nano',
        description: 'Grained calfskin with airy gold hardware and suede knotted ties.',
        price: '₩ 1,490,000',
        image:
          'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'ch-202',
        code: 'Nama',
        name: 'Nama Knit Sneaker',
        description: 'Ultra-light recycled knit sneaker finished with tonal leather piping.',
        price: '₩ 1,020,000',
        image:
          'https://images.unsplash.com/photo-1445205170461-45328911fff3?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'ch-203',
        code: 'Penelope',
        name: 'Penelope Soft Hobo',
        description: 'Soft leather drape with signature coin closure and braided handles.',
        price: '₩ 2,290,000',
        image:
          'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'ch-204',
        code: 'Edith',
        name: 'Edith Weekender',
        description: 'Supple double handles, saddle stitches, and travel-ready compartments.',
        price: '₩ 3,050,000',
        image:
          'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
  {
    slug: 'miumiu',
    name: 'MiuMiu',
    origin: 'Milan, 1993',
    description: 'Playful couture codes in daring silhouettes and luminous palettes.',
    heroImage:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=80',
    narrative:
      'Avant-garde wardrobe pieces gain immutable provenance as soon as they exit the runway.',
    products: [
      {
        id: 'mm-310',
        code: 'Miu Wander',
        name: 'Miu Wander Matelassé',
        description: 'Signature matelassé satin with jewelled handle details.',
        price: '₩ 2,690,000',
        image:
          'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'mm-311',
        code: 'Arcadie',
        name: 'Arcadie Crystal Ballet',
        description: 'Crystal studded satin ballet flats with bow strap and leather sole.',
        price: '₩ 950,000',
        image:
          'https://images.unsplash.com/photo-1495122100239-590c2ccd7d1f?auto=format&fit=crop&w=1200&q=80',
      },
      {
        id: 'mm-312',
        code: 'Solstice',
        name: 'Solstice Tweed Mini',
        description: 'Shimmer tweed mini dress trimmed with silk duchesse piping.',
        price: '₩ 3,550,000',
        image:
          'https://images.unsplash.com/photo-1495122100239-590c2ccd7d1f?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
]

export const findBrand = (slug: string) =>
  brandCatalog.find((brand) => brand.slug.toLowerCase() === slug.toLowerCase())

export const findProduct = (brandSlug: string, productId: string) => {
  const brand = findBrand(brandSlug)
  if (!brand) return null
  return brand.products.find((product) => product.id === productId) ?? null
}
