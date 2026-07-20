export const CATEGORIES = {
  coffee: {
    label: 'Coffee',
    emoji: '☕',
    accent: 'var(--color-roast)',
    brandLabel: 'Roaster',
    variantLabel: 'Blend / Single Origin',
    variantPlaceholder: 'e.g. Ethiopia Natural, Black Cat Espresso',
    priceUnit: 'per_12oz',
    priceUnitLabel: '/ 12 oz',
    referenceOz: 12,
    roastTypes: ['Light', 'Light-Medium', 'Medium', 'Medium-Dark', 'Dark', 'Extra Dark'],
    notesPlaceholder: 'Sourcing, processing method, recommended brew…',
    reviewPlaceholder: 'Dark chocolate, cherry, smooth finish…',
  },
  ice_cream: {
    label: 'Ice Cream',
    emoji: '🍦',
    accent: 'var(--color-sage)',
    brandLabel: 'Brand / Creamery',
    variantLabel: 'Flavor',
    variantPlaceholder: 'e.g. Mint Chocolate Chip, Salted Caramel Swirl',
    priceUnit: 'per_pint',
    priceUnitLabel: '/ pint',
    referenceOz: 16,
    roastTypes: null,
    notesPlaceholder: 'Ingredients, sourcing, dairy vs. dairy-free…',
    reviewPlaceholder: 'Rich, creamy, not too sweet — real cookie chunks…',
  },
}

const SIZE_TO_OZ = { oz: 1, lb: 16, g: 0.03527396, pint: 16, qt: 32 }

export function normalizePrice(rawPrice, rawSize, rawSizeUnit, category) {
  if (!rawPrice || !rawSize || !rawSizeUnit) return null
  const toOz = SIZE_TO_OZ[rawSizeUnit]
  if (!toOz) return null
  const sizeInOz = rawSize * toOz
  const refOz = CATEGORIES[category]?.referenceOz ?? 1
  return parseFloat(((rawPrice / sizeInOz) * refOz).toFixed(2))
}

export function categoryOf(product) {
  return CATEGORIES[product?.category] ?? CATEGORIES.coffee
}

// PostgREST can return the 1:1 product_web_reviews embed as an object or a
// one-element array depending on relationship detection — normalize to row-or-null.
export function webReviewOf(product) {
  const w = product?.product_web_reviews
  return (Array.isArray(w) ? w[0] : w) ?? null
}

// Rounded 1–100 average of an array of { rating } rows, or null if empty.
export function averageRating(reviews) {
  const ratings = (reviews || []).map(r => r.rating).filter(r => typeof r === 'number')
  if (!ratings.length) return null
  return Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
}
