import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const ROAST_TYPES = ['Light', 'Light-Medium', 'Medium', 'Medium-Dark', 'Dark', 'Extra Dark']

export default function AddCoffee() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [brands, setBrands] = useState([])
  const [blendSuggestions, setBlendSuggestions] = useState([])

  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [brandInput, setBrandInput] = useState('')
  const [blend, setBlend] = useState('')
  const [roastType, setRoastType] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('brands').select('id, name').order('name').then(({ data }) => {
      setBrands(data || [])
    })
  }, [])

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

      // 2. Upload photo
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

      // 3. Get or create coffee
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

  const sectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-4)',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-roast-light)', fontSize: 'var(--text-body-sm)', fontFamily: 'var(--font-body)', padding: 0 }}
        >
          ← Back
        </button>
        <h1 className="text-h2">Add Review</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

        {/* Coffee Details */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <p className="text-label" style={{ marginBottom: 'var(--space-4)' }}>Coffee Details</p>
          <div style={sectionStyle}>

            <div>
              <label className="input-label">Brand *</label>
              <input
                list="brands-list"
                className="input"
                value={brandInput}
                onChange={handleBrandChange}
                placeholder="e.g. Intelligentsia"
              />
              <datalist id="brands-list">
                {brands.map(b => <option key={b.id} value={b.name} />)}
              </datalist>
              {brandInput && !selectedBrandId && (
                <p className="input-hint">New brand — will be created</p>
              )}
            </div>

            <div>
              <label className="input-label">Blend / Single Origin</label>
              <input
                list="blends-list"
                className="input"
                value={blend}
                onChange={e => setBlend(e.target.value)}
                placeholder="e.g. Black Cat Classic Espresso"
              />
              {blendSuggestions.length > 0 && (
                <datalist id="blends-list">
                  {blendSuggestions.map(b => <option key={b} value={b} />)}
                </datalist>
              )}
            </div>

            <div>
              <label className="input-label">Roast Type</label>
              <select
                className="input"
                value={roastType}
                onChange={e => setRoastType(e.target.value)}
              >
                <option value="">Select roast…</option>
                {ROAST_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="input-label">Photo</label>
              {photoPreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={photoPreview} alt="preview" style={{ width: 120, height: 120, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                    style={{
                      position: 'absolute', top: -8, right: -8,
                      background: '#DC2626', color: 'white',
                      border: 'none', borderRadius: '50%',
                      width: 22, height: 22, fontSize: 14,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >×</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  style={{
                    width: '100%',
                    border: '2px dashed var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-6)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-muted)',
                    fontSize: 'var(--text-body-sm)',
                    fontFamily: 'var(--font-body)',
                    cursor: 'pointer',
                    transition: 'border-color var(--transition-fast)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-roast-muted)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >
                  Tap to upload packaging photo
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </div>
          </div>
        </div>

        {/* Your Review */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <p className="text-label" style={{ marginBottom: 'var(--space-4)' }}>Your Review *</p>
          <div style={sectionStyle}>

            <div>
              <label className="input-label">
                Score (1–100)
                {score && (
                  <span style={{ marginLeft: 10, fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: 22, color: 'var(--color-roast)' }}>
                    {score}
                  </span>
                )}
              </label>
              <input
                type="range" min="1" max="100"
                value={score || 75}
                onChange={e => setScore(e.target.value)}
                onMouseDown={() => !score && setScore('75')}
                onTouchStart={() => !score && setScore('75')}
                style={{ width: '100%', accentColor: 'var(--color-roast)', margin: '8px 0 4px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                <span>1</span><span>50</span><span>100</span>
              </div>
              {!score && <p className="input-hint">Move the slider to set your score</p>}
            </div>

            <div>
              <label className="input-label">Tasting Notes</label>
              <textarea
                className="input"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Dark chocolate, cherry, smooth finish…"
                style={{ resize: 'none' }}
              />
            </div>
          </div>
        </div>

        {error && <p style={{ color: '#DC2626', fontSize: 'var(--text-body-sm)' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
        >
          {loading ? 'Saving…' : 'Save Review'}
        </button>
      </form>
    </div>
  )
}
