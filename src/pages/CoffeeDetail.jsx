import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ScoreRing from '../components/ScoreRing'

const ROAST_TYPES = ['Light', 'Light-Medium', 'Medium', 'Medium-Dark', 'Dark', 'Extra Dark']

export default function CoffeeDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [coffee, setCoffee] = useState(null)
  const [brand, setBrand] = useState(null)
  const [reviews, setReviews] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)

  const [showRateForm, setShowRateForm] = useState(false)
  const [score, setScore] = useState('75')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function load() {
    const [{ data: coffeeData }, { data: reviewsData }, { data: profilesData }] = await Promise.all([
      supabase.from('coffees').select('*, brands(id, name)').eq('id', id).single(),
      supabase.from('reviews').select('*').eq('coffee_id', id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, display_name'),
    ])

    if (coffeeData) {
      setCoffee(coffeeData)
      setBrand(coffeeData.brands)
    }
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
        .insert({ coffee_id: id, user_id: user.id, score: parseInt(score), notes: notes.trim() || null })
      if (error) throw error
      await load()
      setShowRateForm(false)
      setScore('75')
      setNotes('')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteReview(reviewId) {
    if (!confirm('Delete this review?')) return
    await supabase.from('reviews').delete().eq('id', reviewId)
    await load()
  }

  async function handleDeleteCoffee() {
    if (!confirm('Delete this coffee and all its reviews?')) return
    await supabase.from('coffees').delete().eq('id', id)
    navigate('/')
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function reviewerName(userId) {
    return profiles[userId] || (userId === user?.id ? 'You' : 'Partner')
  }

  if (loading) return <div className="text-center text-amber-600 py-12">Loading…</div>
  if (!coffee) return <div className="text-center text-red-500 py-12">Coffee not found.</div>

  const allScores = reviews.map(r => r.score)
  const avg = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null

  // Group reviews by user for summary
  const byUser = {}
  reviews.forEach(r => {
    if (!byUser[r.user_id]) byUser[r.user_id] = []
    byUser[r.user_id].push(r)
  })

  return (
    <div>
      <button onClick={() => navigate('/')} className="text-amber-600 hover:text-amber-900 text-sm mb-6 block">
        ← Back
      </button>

      {/* Coffee header */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-50 overflow-hidden mb-5">
        {coffee.photo_url && (
          <img src={coffee.photo_url} alt={coffee.blend || brand?.name} className="w-full h-52 object-cover" />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-amber-900">{brand?.name}</h1>
              {coffee.blend && <p className="text-amber-700 mt-0.5 text-lg">{coffee.blend}</p>}
              {coffee.roast_type && (
                <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                  {coffee.roast_type}
                </span>
              )}
            </div>
            <div className="text-center flex-shrink-0">
              <ScoreRing score={avg} size={60} />
              {avg && <p className="text-xs text-amber-400 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Per-user score summary */}
      {Object.keys(byUser).length > 0 && (
        <div className="flex gap-3 mb-5">
          {Object.entries(byUser).map(([userId, userReviews]) => {
            const userAvg = Math.round(userReviews.reduce((s, r) => s + r.score, 0) / userReviews.length)
            return (
              <div key={userId} className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-amber-50 flex items-center gap-3">
                <ScoreRing score={userAvg} size={44} />
                <div>
                  <p className="text-sm font-medium text-amber-900">{reviewerName(userId)}</p>
                  <p className="text-xs text-amber-400">{userReviews.length} review{userReviews.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add review button */}
      {user && !showRateForm && (
        <button
          onClick={() => setShowRateForm(true)}
          className="w-full bg-amber-800 text-white rounded-xl py-3 font-medium hover:bg-amber-900 transition-colors mb-5"
        >
          + Add Review
        </button>
      )}

      {!user && (
        <div className="bg-amber-50 border border-dashed border-amber-200 rounded-xl p-4 text-center mb-5">
          <p className="text-amber-600 text-sm mb-2">Want to review this coffee?</p>
          <Link
            to="/login"
            className="bg-amber-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-amber-900 transition-colors inline-block"
          >
            Sign in to review
          </Link>
        </div>
      )}

      {/* Review form */}
      {showRateForm && (
        <form onSubmit={handleSubmitReview} className="bg-white rounded-xl p-5 shadow-sm border border-amber-100 space-y-4 mb-5">
          <h2 className="font-semibold text-amber-800">Your Review</h2>

          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">
              Score: <span className="text-amber-600 font-bold">{score}</span>
            </label>
            <input
              type="range" min="1" max="100" value={score}
              onChange={e => setScore(e.target.value)}
              className="w-full accent-amber-700"
            />
            <div className="flex justify-between text-xs text-amber-400">
              <span>1</span><span>50</span><span>100</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Tasting Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              placeholder="Dark chocolate, bright acidity, nutty finish…"
            />
          </div>

          {formError && <p className="text-red-600 text-sm">{formError}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-amber-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-amber-900 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowRateForm(false)}
              className="px-4 bg-amber-100 text-amber-800 rounded-lg py-2 text-sm hover:bg-amber-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* All reviews */}
      {reviews.length > 0 && (
        <div className="space-y-3 mb-5">
          <h2 className="font-semibold text-amber-800 text-sm uppercase tracking-wide">All Reviews</h2>
          {reviews.map(review => {
            const isMe = review.user_id === user?.id
            const name = reviewerName(review.user_id)
            return (
              <div key={review.id} className="bg-white rounded-xl p-4 shadow-sm border border-amber-50">
                <div className="flex items-start gap-4">
                  <ScoreRing score={review.score} size={48} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-amber-900 text-sm">{name}</p>
                      <span className="text-xs text-amber-400">{formatDate(review.created_at)}</span>
                    </div>
                    {review.notes && (
                      <p className="text-sm text-amber-700 mt-1 leading-relaxed">"{review.notes}"</p>
                    )}
                    {isMe && (
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-xs text-red-400 hover:text-red-600 mt-2"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Danger zone */}
      {user && (
        <button
          onClick={handleDeleteCoffee}
          className="w-full text-xs text-red-400 hover:text-red-600 py-2 mt-2"
        >
          Delete this coffee and all reviews
        </button>
      )}
    </div>
  )
}
