export const CATEGORIES = {
  coffee: {
    label: 'Coffee',
    emoji: '☕',
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
