import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ScoreRing from '../components/ScoreRing'
import { CATEGORIES, categoryOf } from '../lib/categories'

const BURGUNDY = 'oklch(38% 0.13 25)'
const FOREST = 'oklch(40% 0.09 155)'

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
  const isCoffee = product?.category === 'coffee'
  const accentColor = isCoffee ? BURGUNDY : FOREST

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

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--color-text-muted)', fontWeight: 600 }}>
      Loading…
    </div>
  )
  if (!product) return (
    <div style={{ textAlign: 'center', padding: '64px 0', color: '#DC2626', fontWeight: 600 }}>
      Product not found.
    </div>
  )

  const allRatings = reviews.map(r => r.rating)
  const avg = allRatings.length ? Math.round(allRatings.reduce((a, b) => a + b, 0) / allRatings.length) : null

  const backHref = isCoffee ? '/reviews?category=coffee' : '/reviews?category=ice_cream'
  const backLabel = `← Back to ${isCoffee ? 'Coffee' : 'Ice Cream'}`
  const tags = product.roast_type ? [product.roast_type] : []

  return (
    <div>
      {/* Back link */}
      <Link
        to={backHref}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginTop: 24,
          fontFamily: 'var(--font-body)',
          fontWeight: 700, fontSize: 13,
          color: accentColor,
          textDecoration: 'none',
        }}
      >
        {backLabel}
      </Link>

      {/* 2-col layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 420px) 1fr',
        gap: 40,
        marginTop: 20,
        alignItems: 'start',
      }}>
        {/* Image */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/3',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 12px 28px -14px rgba(40,20,10,0.35)',
          background: 'oklch(93% 0.02 78)',
        }}>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.variant || product.brand}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
              {isCoffee ? '☕' : '🍦'}
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Category badge + score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              padding: '5px 14px', borderRadius: 999,
              background: accentColor,
              color: 'oklch(98% 0.01 90)',
              fontWeight: 700, fontSize: 12, lineHeight: '1.4',
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              {cat.label}
            </div>
            {avg != null && <ScoreRing score={avg} size={60} />}
          </div>

          {/* Name */}
          <div style={{ font: `400 44px/1.1 'Abril Fatface', serif`, color: 'oklch(24% 0.02 40)' }}>
            {product.variant || product.brand}
          </div>

          {/* Brand */}
          <div style={{
            fontWeight: 700, fontSize: 14, lineHeight: '1.4',
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: accentColor,
          }}>
            {product.brand}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {tags.map(tag => (
                <span key={tag} style={{
                  fontWeight: 600, fontSize: 12, lineHeight: '1.4',
                  color: 'oklch(24% 0.02 40)',
                  background: 'oklch(94% 0.02 75)',
                  padding: '4px 12px', borderRadius: 999,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div style={{ height: 1, background: 'var(--color-border)', margin: '6px 0' }} />

          {/* Notes */}
          {product.notes && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>
                Notes
              </div>
              <div style={{ fontWeight: 400, fontSize: 16, lineHeight: '1.6', color: 'oklch(28% 0.02 40)' }}>
                {product.notes}
              </div>
            </div>
          )}

          {/* Price */}
          {product.normalized_price && (
            <div style={{ display: 'flex', gap: 10, fontWeight: 600, fontSize: 14, lineHeight: '1.5' }}>
              <span style={{ minWidth: 110, color: 'var(--color-text-muted)' }}>Price</span>
              <span>${product.normalized_price.toFixed(2)} {cat.priceUnitLabel}</span>
            </div>
          )}

          {/* Review count */}
          {reviews.length > 0 && (
            <div style={{ display: 'flex', gap: 10, fontWeight: 600, fontSize: 14, lineHeight: '1.5' }}>
              <span style={{ minWidth: 110, color: 'var(--color-text-muted)' }}>Reviews</span>
              <span>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Add review */}
          {user && !showRateForm && (
            <button
              onClick={() => setShowRateForm(true)}
              style={{
                marginTop: 8,
                padding: '12px 24px',
                borderRadius: 999,
                background: accentColor,
                color: 'oklch(97% 0.02 85)',
                fontFamily: 'var(--font-body)',
                fontWeight: 700, fontSize: 14,
                border: 'none', cursor: 'pointer',
                alignSelf: 'flex-start',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              + Add Review
            </button>
          )}

          {!user && (
            <Link to="/login" style={{
              marginTop: 8,
              padding: '12px 24px',
              borderRadius: 999,
              border: `1.5px solid ${accentColor}`,
              color: accentColor,
              fontFamily: 'var(--font-body)',
              fontWeight: 700, fontSize: 14,
              textDecoration: 'none',
              alignSelf: 'flex-start',
            }}>
              Sign in to review
            </Link>
          )}
        </div>
      </div>

      {/* Review form */}
      {showRateForm && (
        <form onSubmit={handleSubmitReview} style={{
          marginTop: 32,
          background: 'oklch(99% 0.008 80)',
          borderRadius: 22,
          padding: 28,
          boxShadow: '0 1px 2px rgba(40,20,10,0.06), 0 10px 24px -12px rgba(40,20,10,0.18)',
        }}>
          <div style={{ font: `400 22px/1.1 'Abril Fatface', serif`, color: 'oklch(24% 0.02 40)', marginBottom: 20 }}>
            Your Review
          </div>

          <div style={{ marginBottom: 18 }}>
            <label className="input-label">
              Rating: <span style={{ color: accentColor, fontWeight: 800, fontSize: 20 }}>{rating}</span>
              <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--color-text-muted)' }}> / 100</span>
            </label>
            <input
              type="range" min="1" max="100" value={rating}
              onChange={e => setRating(e.target.value)}
              style={{ width: '100%', accentColor, margin: '8px 0 4px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
              <span>1</span><span>50</span><span>100</span>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label className="input-label">Tasting Notes</label>
            <textarea
              className="input"
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={3}
              placeholder={cat.reviewPlaceholder}
              style={{ resize: 'none', borderRadius: 12 }}
            />
          </div>

          {formError && <p style={{ color: '#DC2626', fontSize: 14, marginBottom: 12 }}>{formError}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} style={{
              flex: 1, padding: '12px', borderRadius: 999,
              background: accentColor, color: 'oklch(97% 0.02 85)',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
              border: 'none', cursor: 'pointer',
            }}>
              {saving ? 'Saving…' : 'Save Review'}
            </button>
            <button type="button" onClick={() => setShowRateForm(false)} style={{
              padding: '12px 20px', borderRadius: 999,
              background: 'transparent',
              border: '1.5px solid var(--color-border)',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', color: 'var(--color-text-secondary)',
            }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* All reviews */}
      {reviews.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <div style={{ font: `400 24px/1.1 'Abril Fatface', serif`, color: 'oklch(24% 0.02 40)', marginBottom: 16 }}>
            Reviews
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reviews.map(review => {
              const isMe = review.user_id === user?.id
              const isEditing = editingReviewId === review.id
              return (
                <div key={review.id} style={{
                  background: 'oklch(99% 0.008 80)',
                  borderRadius: 18,
                  padding: '18px 20px',
                  boxShadow: '0 1px 2px rgba(40,20,10,0.05), 0 6px 14px -8px rgba(40,20,10,0.18)',
                }}>
                  {isEditing ? (
                    <form onSubmit={handleSaveEdit}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'oklch(24% 0.02 40)', marginBottom: 14 }}>
                        Edit your review
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label className="input-label">
                          Rating: <span style={{ color: accentColor, fontWeight: 800, fontSize: 18 }}>{editRating}</span>
                        </label>
                        <input
                          type="range" min="1" max="100" value={editRating}
                          onChange={e => setEditRating(e.target.value)}
                          style={{ width: '100%', accentColor, margin: '6px 0 4px' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                          <span>1</span><span>50</span><span>100</span>
                        </div>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label className="input-label">Tasting Notes</label>
                        <textarea
                          className="input"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          rows={3}
                          placeholder={cat.reviewPlaceholder}
                          style={{ resize: 'none', borderRadius: 12 }}
                        />
                      </div>
                      {editError && <p style={{ color: '#DC2626', fontSize: 14, marginBottom: 12 }}>{editError}</p>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="submit" disabled={editSaving} style={{
                          flex: 1, padding: '10px', borderRadius: 999,
                          background: accentColor, color: 'oklch(97% 0.02 85)',
                          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
                          border: 'none', cursor: 'pointer',
                        }}>
                          {editSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" onClick={() => setEditingReviewId(null)} style={{
                          padding: '10px 16px', borderRadius: 999,
                          background: 'transparent', border: '1.5px solid var(--color-border)',
                          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
                          cursor: 'pointer', color: 'var(--color-text-secondary)',
                        }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <ScoreRing score={review.rating} size={52} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: 'oklch(24% 0.02 40)' }}>
                            {reviewerName(review.user_id)}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                        {review.review_text && (
                          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                            "{review.review_text}"
                          </p>
                        )}
                        {isMe && (
                          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                            <button onClick={() => startEdit(review)} style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 12, color: accentColor, padding: 0,
                              fontFamily: 'var(--font-body)', fontWeight: 700,
                            }}>
                              Edit
                            </button>
                            <button onClick={() => handleDeleteReview(review.id)} style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontSize: 12, color: 'var(--color-text-muted)', padding: 0,
                              fontFamily: 'var(--font-body)', fontWeight: 700,
                            }}
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

      {/* Delete product */}
      {user && (
        <button
          onClick={handleDeleteProduct}
          style={{
            display: 'block', width: '100%', marginTop: 40,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--color-text-muted)',
            padding: '8px', fontFamily: 'var(--font-body)', fontWeight: 600,
          }}
          onMouseEnter={e => e.target.style.color = '#DC2626'}
          onMouseLeave={e => e.target.style.color = 'var(--color-text-muted)'}
        >
          Delete this {cat.label.toLowerCase()} and all reviews
        </button>
      )}
    </div>
  )
}
