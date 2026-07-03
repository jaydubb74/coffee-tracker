import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ScoreRing from '../components/ScoreRing'
import { CATEGORIES } from '../lib/categories'

export default function ReviewFeed() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('') // '' = all
  const [brandFilter, setBrandFilter] = useState('')

  useEffect(() => {
    supabase
      .from('reviews')
      .select(`
        id, rating, review_text, created_at, user_id,
        products ( id, category, brand, variant, roast_type, image_url )
      `)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews(data || [])
        setLoading(false)
      })
  }, [])

  const visibleReviews = reviews.filter(r => {
    const p = r.products
    if (!p) return false
    if (categoryFilter && p.category !== categoryFilter) return false
    const q = search.toLowerCase()
    if (q) {
      const haystack = [p.brand, p.variant, r.review_text].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    if (brandFilter && p.brand !== brandFilter) return false
    return true
  })

  // Brand list filtered by current category filter
  const brandsForFilter = [...new Set(
    reviews
      .map(r => r.products)
      .filter(p => p && (!categoryFilter || p.category === categoryFilter))
      .map(p => p.brand)
  )].sort()

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function reviewerName(userId) {
    if (!user) return null
    return userId === user.id ? 'Josh' : 'Erin'
  }

  function roastChipClass(roast) {
    if (!roast) return 'chip chip-origin'
    const r = roast.toLowerCase()
    if (r.includes('light')) return 'chip chip-roast-light'
    if (r.includes('dark')) return 'chip chip-roast-dark'
    return 'chip chip-roast-medium'
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
        <div>
          <h1 className="text-h2">Recent Reviews</h1>
          {reviews.length > 0 && (
            <p className="text-caption" style={{ marginTop: 4 }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        {user && (
          <Link to="/add" className="btn btn-primary btn-sm">
            + Add Review
          </Link>
        )}
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <button
          onClick={() => { setCategoryFilter(''); setBrandFilter('') }}
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            border: `1.5px solid ${!categoryFilter ? 'var(--color-roast)' : 'var(--color-border)'}`,
            background: !categoryFilter ? 'var(--color-bg-parchment)' : 'transparent',
            color: !categoryFilter ? 'var(--color-espresso)' : 'var(--color-text-secondary)',
            fontFamily: 'var(--font-body)',
            fontWeight: !categoryFilter ? 'var(--weight-semibold)' : 'var(--weight-regular)',
            fontSize: 'var(--text-body-sm)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          All
        </button>
        {Object.entries(CATEGORIES).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => { setCategoryFilter(key); setBrandFilter('') }}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${categoryFilter === key ? 'var(--color-roast)' : 'var(--color-border)'}`,
              background: categoryFilter === key ? 'var(--color-bg-parchment)' : 'transparent',
              color: categoryFilter === key ? 'var(--color-espresso)' : 'var(--color-text-secondary)',
              fontFamily: 'var(--font-body)',
              fontWeight: categoryFilter === key ? 'var(--weight-semibold)' : 'var(--weight-regular)',
              fontSize: 'var(--text-body-sm)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {cfg.emoji} {cfg.label}
          </button>
        ))}
      </div>

      {/* Search + brand filter */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        <input
          className="input"
          type="search"
          placeholder="Search brand, flavor, notes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        {brandsForFilter.length > 1 && (
          <select
            className="input"
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 130 }}
          >
            <option value="">All brands</option>
            {brandsForFilter.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', letterSpacing: 1 }}>
          Loading…
        </div>
      ) : visibleReviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>
            {categoryFilter ? CATEGORIES[categoryFilter].emoji : '☕🍦'}
          </div>
          <p className="text-body-sm">
            {search || brandFilter || categoryFilter ? 'No matches found.' : 'No reviews yet — add your first one!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {visibleReviews.map(review => {
            const p = review.products
            const cat = CATEGORIES[p?.category] ?? CATEGORIES.coffee
            return (
              <Link
                key={review.id}
                to={`/product/${p?.id}`}
                className="card"
                style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4)', textDecoration: 'none', color: 'inherit' }}
              >
                {/* Photo */}
                <div style={{ flexShrink: 0 }}>
                  {p?.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.variant || p.brand}
                      style={{ width: 80, height: 80, borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-parchment)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                      {cat.emoji}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-h4)', color: 'var(--color-espresso)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p?.brand}
                      </p>
                      {p?.variant && (
                        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.variant}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                        {p?.roast_type && (
                          <span className={roastChipClass(p.roast_type)}>{p.roast_type}</span>
                        )}
                      </div>
                    </div>
                    <ScoreRing score={review.rating} size={44} />
                  </div>

                  {review.review_text && (
                    <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)', fontStyle: 'italic', lineHeight: 'var(--leading-relaxed)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      "{review.review_text}"
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    {user && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', color: 'var(--color-roast-light)', fontWeight: 'var(--weight-medium)' }}>
                        {reviewerName(review.user_id)}
                      </span>
                    )}
                    <span style={{ color: 'var(--color-border)', fontSize: 12 }}>·</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {!user && (
        <p style={{ textAlign: 'center', marginTop: 'var(--space-7)', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--color-roast-light)', textDecoration: 'underline' }}>
            Sign in
          </Link>{' '}to add reviews
        </p>
      )}
    </div>
  )
}
