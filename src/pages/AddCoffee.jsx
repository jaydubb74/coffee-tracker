import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const ROAST_TYPES = ['Light', 'Light-Medium', 'Medium', 'Medium-Dark', 'Dark', 'Extra Dark']

export default function AddCoffee() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [brands, setBrands] = useState([])        // [{id, name}]
  const [blendSuggestions, setBlendSuggestions] = useState([]) // existing blends for selected brand

  const [selectedBrandId, setSelectedBrandId] = useState('')  // existing brand id
  const [brandInput, setBrandInput] = useState('')            // typed brand name
  const [blend, setBlend] = useState('')
  const [roastType, setRoastType] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load existing brands on mount
  useEffect(() => {
    supabase.from('brands').select('id, name').order('name').then(({ data }) => {
      setBrands(data || [])
    })
  }, [])

  // When brand changes, load existing blends for that brand
  useEffect(() => {
    if (!selectedBrandId) { setBlendSuggestions([]); return }
    supabase
      .from('coffees')
      .select('blend')
      .eq('brand_id', selectedBrandId)
      .then(({ data }) => {
        setBlendSuggestions([...new Set((data || []).map(c => c.blend).filter(Boolean))])
      })
  }, [selectedBrandId])

  function handleBrandChange(e) {
    const val = e.target.value
    setBrandInput(val)
    const match = brands.find(b => b.name.toLowerCase() === val.toLowerCase())
    setSelectedBrandId(match ? match.id : '')
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const brandName = brandInput.trim()
    if (!brandName) { setError('Brand is required'); return }
    if (!score) { setError('Please set a score'); return }
    setError('')
    setLoading(true)

    try {
      // 1. Get or create brand
      let brandId = selectedBrandId
      if (!brandId) {
        const { data, error: brandErr } = await supabase
          .from('brands')
          .insert({ name: brandName })
          .select()
          .single()
        if (brandErr) throw brandErr
        brandId = data.id
      }

      // 2. Upload photo if provided
      let photo_url = null
      if (photo) {
        const ext = photo.name.split('.').pop()
        const path = `${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('coffee-photos')
          .upload(path, photo)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage
          .from('coffee-photos')
          .getPublicUrl(path)
        photo_url = publicUrl
      }

      // 3. Get or create coffee (brand + blend unique pair)
      const blendVal = blend.trim() || null
      let coffee
      const { data: existing } = await supabase
        .from('coffees')
        .select('*')
        .eq('brand_id', brandId)
        .is(blendVal ? 'blend' : 'blend', blendVal)
        .maybeSingle()

      if (existing) {
        coffee = existing
        // Update photo if we have a new one and the coffee didn't have one
        if (photo_url && !existing.photo_url) {
          await supabase.from('coffees').update({ photo_url, roast_type: roastType || existing.roast_type }).eq('id', existing.id)
          coffee = { ...existing, photo_url, roast_type: roastType || existing.roast_type }
        }
      } else {
        const { data, error: coffeeErr } = await supabase
          .from('coffees')
          .insert({ brand_id: brandId, blend: blendVal, roast_type: roastType || null, photo_url })
          .select()
          .single()
        if (coffeeErr) throw coffeeErr
        coffee = data
      }

      // 4. Insert review
      const { error: reviewErr } = await supabase
        .from('reviews')
        .insert({ coffee_id: coffee.id, user_id: user.id, score: parseInt(score), notes: notes.trim() || null })
      if (reviewErr) throw reviewErr

      navigate(`/coffee/${coffee.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-amber-600 hover:text-amber-900 text-sm">← Back</button>
        <h1 className="text-xl font-bold text-amber-900">Add Review</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Coffee details */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-50 space-y-4">
          <h2 className="font-semibold text-amber-800 text-sm uppercase tracking-wide">Coffee Details</h2>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Brand *</label>
            <input
              list="brands-list"
              value={brandInput}
              onChange={handleBrandChange}
              className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. Intelligentsia"
            />
            <datalist id="brands-list">
              {brands.map(b => <option key={b.id} value={b.name} />)}
            </datalist>
            {brandInput && !selectedBrandId && (
              <p className="text-xs text-amber-500 mt-1">New brand — will be created</p>
            )}
          </div>

          {/* Blend */}
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Blend / Single Origin</label>
            <input
              list="blends-list"
              value={blend}
              onChange={e => setBlend(e.target.value)}
              className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. Black Cat Classic Espresso"
            />
            {blendSuggestions.length > 0 && (
              <datalist id="blends-list">
                {blendSuggestions.map(b => <option key={b} value={b} />)}
              </datalist>
            )}
          </div>

          {/* Roast type */}
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Roast Type</label>
            <select
              value={roastType}
              onChange={e => setRoastType(e.target.value)}
              className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            >
              <option value="">Select roast…</option>
              {ROAST_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Photo</label>
            {photoPreview ? (
              <div className="relative inline-block">
                <img src={photoPreview} alt="preview" className="w-32 h-32 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                >×</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="w-full border-2 border-dashed border-amber-200 rounded-lg py-6 text-amber-500 text-sm hover:border-amber-400 transition-colors"
              >
                Tap to upload packaging photo
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </div>
        </div>

        {/* Review */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-amber-50 space-y-4">
          <h2 className="font-semibold text-amber-800 text-sm uppercase tracking-wide">Your Review *</h2>

          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">
              Score (1–100)
              {score && <span className="ml-2 text-amber-600 font-bold">{score}</span>}
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={score || 75}
              onChange={e => setScore(e.target.value)}
              onMouseDown={() => !score && setScore('75')}
              onTouchStart={() => !score && setScore('75')}
              className="w-full accent-amber-700"
            />
            <div className="flex justify-between text-xs text-amber-400 mt-1">
              <span>1</span><span>50</span><span>100</span>
            </div>
            {!score && <p className="text-xs text-amber-400 mt-1">Move the slider to set your score</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Tasting Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              placeholder="e.g. Dark chocolate, cherry, smooth finish…"
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-800 text-white rounded-xl py-3 font-medium hover:bg-amber-900 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving…' : 'Save Review'}
        </button>
      </form>
    </div>
  )
}
