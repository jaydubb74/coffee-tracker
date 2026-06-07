import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ScoreRing from '../components/ScoreRing'

export default function CoffeeList() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('')
  const [brands, setBrands] = useState([])

  useEffect(() => {
    async function load() {
      const [{ data: reviewData }, { data: brandData }] = await Promise.all([
        supabase
          .from('reviews')
          .select(`
            id, score, notes, created_at, user_id,
            coffees (
              id, blend, roast_type, photo_url,
              brands ( id, name )
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('brands').select('id, name').order('name'),
      ])
      setReviews(reviewData || [])
      setBrands(brandData || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = reviews.filter(r => {
    const brand = r.coffees?.brands?.name?.toLowerCase() || ''
    const blend = r.coffees?.blend?.toLowerCase() || ''
    const notes = r.notes?.toLowerCase() || ''
    const q = search.toLowerCase()
    const matchesSearch = !q || brand.includes(q) || blend.includes(q) || notes.includes(q)
    const matchesBrand = !brandFilter || r.coffees?.brands?.id === brandFilter
    return matchesSearch && matchesBrand
  })

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
    if (r.includes('dark'))  return 'chip chip-roast-dark'
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

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        <input
          className="input"
          type="search"
          placeholder="Search brand, blend, notes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        {brands.length > 0 && (
          <select
            className="input"
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 130 }}
          >
            <option value="">All brands</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', letterSpacing: 1 }}>
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>☕</div>
          <p className="text-body-sm">
            {search || brandFilter ? 'No matches found.' : 'No reviews yet — add your first one!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filtered.map(review => {
            const coffee = review.coffees
            const brand = coffee?.brands?.name
            return (
              <Link
                key={review.id}
                to={`/coffee/${coffee?.id}`}
                className="card"
                style={{
                  display: 'flex',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-4)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                {/* Photo */}
                <div style={{ flexShrink: 0 }}>
                  {coffee?.photo_url ? (
                    <img
                      src={coffee.photo_url}
                      alt={coffee.blend || brand}
                      style={{ width: 80, height: 80, borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: 80, height: 80,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg-parchment)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 32,
                    }}>
                      ☕
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 'var(--weight-semibold)',
                        fontSize: 'var(--text-h4)',
                        color: 'var(--color-espresso)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {brand}
                      </p>
                      {coffee?.blend && (
                        <p style={{
                          fontSize: 'var(--text-body-sm)',
                          color: 'var(--color-text-secondary)',
                          marginTop: 2,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {coffee.blend}
                        </p>
                      )}
                      {coffee?.roast_type && (
                        <span className={roastChipClass(coffee.roast_type)} style={{ marginTop: 'var(--space-2)' }}>
                          {coffee.roast_type}
                        </span>
                      )}
                    </div>
                    <ScoreRing score={review.score} size={44} />
                  </div>

                  {review.notes && (
                    <p style={{
                      fontSize: 'var(--text-body-sm)',
                      color: 'var(--color-text-secondary)',
                      marginTop: 'var(--space-2)',
                      fontStyle: 'italic',
                      lineHeight: 'var(--leading-relaxed)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      "{review.notes}"
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
