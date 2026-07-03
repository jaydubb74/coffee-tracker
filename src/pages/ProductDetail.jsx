import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ScoreRing from '../components/ScoreRing'
import { CATEGORIES, categoryOf } from '../lib/categories'

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)

  const [showRateForm, setShowRateForm] = useState(false)
  const [rating, setRating] = useState('75')
  const [reviewText, setReviewText] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [editingReviewId, setEditingReviewId] = useState(null)
  const [editRating, setEditRating] = useState('75')
  const [editText, setEditText] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const cat = product ? categoryOf(product) : CATEGORIES.coffee

  async function load() {
    const [{ data: productData }, { data: reviewsData }, { data: profilesData }] = await Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, display_name'),
    ])
    if (productData) setProduct(productData)
    setReviews(reviewsData || [])
    if (profilesData) {
      const map = {}
      profilesData.forEach(p => { map[p.id] = p.display_name })
      setProfiles(map)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function handleSubmitReview(e) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({ product_id: id, user_id: user.id, rating: parseInt(rating), review_text: reviewText.trim() || null })
      if (error) throw error
      await load()
      setShowRateForm(false)
      setRating('75')
      setReviewText('')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function startEdit(review) {
    setEditingReviewId(review.id)
    setEditRating(String(review.rating))
    setEditText(review.review_text || '')
    setEditError('')
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    setEditSaving(true)
    setEditError('')
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ rating: parseInt(editRating), review_text: editText.trim() || null })
        .eq('id', editingReviewId)
      if (error) throw error
      setEditingReviewId(null)
      await load()
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!confirm('Delete this review?')) return
    await supabase.from('reviews').delete().eq('id', reviewId)
    await load()
  }

  async function handleDeleteProduct() {
    if (!confirm(`Delete this ${cat.label.toLowerCase()} and all its reviews?`)) return
    await supabase.from('products').delete().eq('id', id)
    navigate('/reviews')
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function reviewerName(userId) {
    return profiles[userId] || (userId === user?.id ? 'You' : 'Reviewer')
  }

  function roastChipClass(roast) {
    if (!roast) return 'chip chip-origin'
    const r = roast.toLowerCase()
    if (r.includes('light')) return 'chip chip-roast-light'
    if (r.includes('dark')) return 'chip chip-roast-dark'
    return 'chip chip-roast-medium'
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', letterSpacing: 1 }}>
      Loading…
    </div>
  )
  if (!product) return (
    <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: '#DC2626' }}>Product not found.</div>
  )

  const allRatings = reviews.map(r => r.rating)
  const avg = allRatings.length ? Math.round(allRatings.reduce((a, b) => a + b, 0) / allRatings.length) : null

  const byUser = {}
  reviews.forEach(r => {
    if (!byUser[r.user_id]) byUser[r.user_id] = []
    byUser[r.user_id].push(r)
  })

  return (
    <div>
      <button
        onClick={() => navigate('/reviews')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-roast-light)', fontSize: 'var(--text-body-sm)', fontFamily: 'var(--font-body)', marginBottom: 'var(--space-5)', padding: 0 }}
      >
        ← Back
      </button>

      {/* Product header */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 'var(--space-4)' }}>
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.variant || product.brand}
            style={{ width: '100%', height: 220, objectFit: 'cover' }}
          />
        )}
        <div style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
            <div>
              {/* Category badge */}
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--color-roast-muted)', marginBottom: 4 }}>
                {cat.emoji} {cat.label}
              </p>
              <h1 className="text-h2">{product.brand}</h1>
              {product.variant && (
                <p style={{ color: 'var(--color-text-secondary)', marginTop: 4, fontSize: 'var(--text-body)' }}>
                  {product.variant}
                </p>
              )}
              {product.roast_type && (
                <span className={roastChipClass(product.roast_type)} style={{ marginTop: 'var(--space-3)', display: 'inline-flex' }}>
                  {product.roast_type}
                </span>
              )}
              {product.normalized_price && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                  ${product.normalized_price.toFixed(2)} {cat.priceUnitLabel}
                </p>
              )}
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <ScoreRing score={avg} size={60} />
              {avg && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                  avg
                </p>
              )}
            </div>
          </div>
          {product.notes && (
            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-3)', lineHeight: 'var(--leading-relaxed)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-3)' }}>
              {product.notes}
            </p>
          )}
        </div>
      </div>

      {/* Per-user averages */}
      {Object.keys(byUser).length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          {Object.entries(byUser).map(([userId, userReviews]) => {
            const userAvg = Math.round(userReviews.reduce((s, r) => s + r.rating, 0) / userReviews.length)
            return (
              <div key={userId} className="card" style={{ flex: 1, padding: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <ScoreRing score={userAvg} size={44} />
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-body-sm)', color: 'var(--color-espresso)' }}>
                    {reviewerName(userId)}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {userReviews.length} review{userReviews.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add review CTA */}
      {user && !showRateForm && (
        <button
          onClick={() => setShowRateForm(true)}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginBottom: 'var(--space-4)' }}
        >
          + Add Review
        </button>
      )}

      {!user && (
        <div style={{ background: 'var(--color-bg-parchment)', border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm)', marginBottom: 'var(--space-3)' }}>
            Want to review this {cat.label.toLowerCase()}?
          </p>
          <Link to="/login" className="btn btn-secondary btn-sm">
            Sign in to review
          </Link>
        </div>
      )}

      {/* Review form */}
      {showRateForm && (
        <form onSubmit={handleSubmitReview} className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
          <h2 className="text-h4" style={{ marginBottom: 'var(--space-4)', color: 'var(--color-roast)' }}>Your Review</h2>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label className="input-label">
              Rating: <span style={{ color: 'var(--color-roast)', fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: 20 }}>{rating}</span>
            </label>
            <input
              type="range" min="1" max="100" value={rating}
              onChange={e => setRating(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--color-roast)', margin: '8px 0 4px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
              <span>1</span><span>50</span><span>100</span>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label className="input-label">Tasting Notes</label>
            <textarea
              className="input"
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={3}
              placeholder={cat.reviewPlaceholder}
              style={{ resize: 'none' }}
            />
          </div>

          {formError && <p style={{ color: '#DC2626', fontSize: 'var(--text-body-sm)', marginBottom: 'var(--space-3)' }}>{formError}</p>}

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
              {saving ? 'Saving…' : 'Save Review'}
            </button>
            <button type="button" onClick={() => setShowRateForm(false)} className="btn btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* All reviews */}
      {reviews.length > 0 && (
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <p className="text-label" style={{ marginBottom: 'var(--space-3)' }}>All Reviews</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {reviews.map(review => {
              const isMe = review.user_id === user?.id
              const isEditing = editingReviewId === review.id
              return (
                <div key={review.id} className="card" style={{ padding: 'var(--space-4)' }}>
                  {isEditing ? (
                    <form onSubmit={handleSaveEdit}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-body-sm)', color: 'var(--color-espresso)' }}>
                          Edit your review
                        </p>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
                          {formatDate(review.created_at)}
                        </span>
                      </div>

                      <div style={{ marginBottom: 'var(--space-3)' }}>
                        <label className="input-label">
                          Rating: <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: 20, color: 'var(--color-roast)' }}>{editRating}</span>
                        </label>
                        <input
                          type="range" min="1" max="100" value={editRating}
                          onChange={e => setEditRating(e.target.value)}
                          style={{ width: '100%', accentColor: 'var(--color-roast)', margin: '6px 0 4px' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                          <span>1</span><span>50</span><span>100</span>
                        </div>
                      </div>

                      <div style={{ marginBottom: 'var(--space-3)' }}>
                        <label className="input-label">Tasting Notes</label>
                        <textarea
                          className="input"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          rows={3}
                          placeholder={cat.reviewPlaceholder}
                          style={{ resize: 'none' }}
                        />
                      </div>

                      {editError && <p style={{ color: '#DC2626', fontSize: 'var(--text-body-sm)', marginBottom: 'var(--space-3)' }}>{editError}</p>}

                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button type="submit" disabled={editSaving} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                          {editSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" onClick={() => setEditingReviewId(null)} className="btn btn-ghost btn-sm">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                      <ScoreRing score={review.rating} size={48} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-body-sm)', color: 'var(--color-espresso)' }}>
                            {reviewerName(review.user_id)}
                          </p>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                        {review.review_text && (
                          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)', lineHeight: 'var(--leading-relaxed)', fontStyle: 'italic' }}>
                            "{review.review_text}"
                          </p>
                        )}
                        {isMe && (
                          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                            <button
                              onClick={() => startEdit(review)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-caption)', color: 'var(--color-roast-light)', padding: 0, fontFamily: 'var(--font-body)', transition: 'color var(--transition-fast)' }}
                              onMouseEnter={e => e.target.style.color = 'var(--color-roast)'}
                              onMouseLeave={e => e.target.style.color = 'var(--color-roast-light)'}
                            >
                              Edit
                            </button>
                            <span style={{ color: 'var(--color-border)', fontSize: 12 }}>·</span>
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', padding: 0, fontFamily: 'var(--font-body)', transition: 'color var(--transition-fast)' }}
                              onMouseEnter={e => e.target.style.color = '#DC2626'}
                              onMouseLeave={e => e.target.style.color = 'var(--color-text-muted)'}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {user && (
        <button
          onClick={handleDeleteProduct}
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', padding: 'var(--space-2)', fontFamily: 'var(--font-body)', transition: 'color var(--transition-fast)' }}
          onMouseEnter={e => e.target.style.color = '#DC2626'}
          onMouseLeave={e => e.target.style.color = 'var(--color-text-muted)'}
        >
          Delete this {cat.label.toLowerCase()} and all reviews
        </button>
      )}
    </div>
  )
}
