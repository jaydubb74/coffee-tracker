import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ReviewCard from '../components/ReviewCard'

const BURGUNDY = 'oklch(38% 0.13 25)'
const FOREST = 'oklch(40% 0.09 155)'

export default function ReviewFeed() {
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category') || ''

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('products')
      .select('id, category, brand, variant, roast_type, image_url, reviews(rating)')
      .order('brand')
      .then(({ data }) => {
        setProducts(data || [])
        setLoading(false)
      })
  }, [])

  const isCoffee = categoryParam === 'coffee'
  const isIce = categoryParam === 'ice_cream'
  const accentColor = isIce ? FOREST : BURGUNDY
  const title = isIce ? 'Ice Cream' : isCoffee ? 'Coffee' : null
  const subtitle = isIce
    ? 'Pints worth freezer space, scooped and scored.'
    : isCoffee
      ? 'Whole-bean bags worth coming back to, roast after roast.'
      : null

  const withAvg = products.map(p => {
    const ratings = (p.reviews || []).map(r => r.rating)
    const avg = ratings.length ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : null
    return { ...p, avg }
  })

  const filtered = withAvg.filter(p => {
    if (categoryParam && p.category !== categoryParam) return false
    if (search) {
      const q = search.toLowerCase()
      const hay = [p.brand, p.variant].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  return (
    <div>
      {/* Category header banner */}
      {title && (
        <div style={{
          marginTop: 24,
          padding: '30px 34px',
          borderRadius: 22,
          background: accentColor,
          color: 'oklch(97% 0.02 85)',
          marginBottom: 30,
        }}>
          <div style={{ font: `400 38px/1.1 'Abril Fatface', serif` }}>{title}</div>
          <div style={{ font: `600 14px/1.5 'Nunito Sans', sans-serif`, opacity: 0.85, marginTop: 8, maxWidth: 520 }}>
            {subtitle}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 28 }}>
        <input
          className="input"
          type="search"
          placeholder={`Search ${title || 'coffee & ice cream'}…`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 400, borderRadius: 999, background: 'oklch(99% 0.008 80)' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)', fontWeight: 600 }}>
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{isIce ? '🍦' : isCoffee ? '☕' : '☕🍦'}</div>
          <p style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            {search ? 'No matches found.' : 'Nothing here yet.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 22,
        }}>
          {filtered.map(p => <ReviewCard key={p.id} product={p} avg={p.avg} />)}
        </div>
      )}
    </div>
  )
}
