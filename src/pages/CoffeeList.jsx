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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-amber-900">Recent Reviews</h1>
        {user && (
          <Link
            to="/add"
            className="bg-amber-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-amber-900 transition-colors"
          >
            + Add Review
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="search"
          placeholder="Search brand, blend, notes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
        />
        {brands.length > 0 && (
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            className="border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-amber-800"
          >
            <option value="">All brands</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="text-center text-amber-600 py-12">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-amber-500 py-12">
          {search || brandFilter ? 'No matches.' : 'No reviews yet — add your first one!'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(review => {
            const coffee = review.coffees
            const brand = coffee?.brands?.name
            return (
              <Link
                key={review.id}
                to={`/coffee/${coffee?.id}`}
                className="flex gap-4 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-amber-50"
              >
                {/* Photo */}
                <div className="flex-shrink-0">
                  {coffee?.photo_url ? (
                    <img
                      src={coffee.photo_url}
                      alt={coffee.blend || brand}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-amber-100 flex items-center justify-center text-3xl">
                      ☕
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-amber-900 truncate">{brand}</p>
                      {coffee?.blend && (
                        <p className="text-sm text-amber-700 truncate">{coffee.blend}</p>
                      )}
                      {coffee?.roast_type && (
                        <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-600 rounded-full px-2 py-0.5">
                          {coffee.roast_type}
                        </span>
                      )}
                    </div>
                    <ScoreRing score={review.score} size={44} />
                  </div>

                  {review.notes && (
                    <p className="text-sm text-amber-700 mt-2 line-clamp-2 leading-relaxed">
                      "{review.notes}"
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    {user && (
                      <span className="text-xs font-medium text-amber-500">
                        {reviewerName(review.user_id)}
                      </span>
                    )}
                    <span className="text-xs text-amber-300">·</span>
                    <span className="text-xs text-amber-400">{formatDate(review.created_at)}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {!user && (
        <p className="text-center text-amber-400 text-xs mt-8">
          <Link to="/login" className="underline hover:text-amber-700">Sign in</Link> to add reviews
        </p>
      )}
    </div>
  )
}
