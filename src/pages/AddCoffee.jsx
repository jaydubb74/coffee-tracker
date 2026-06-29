import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const ROAST_TYPES = ['Light', 'Light-Medium', 'Medium', 'Medium-Dark', 'Dark', 'Extra Dark']
const NEW_COFFEE = '__new__'

export default function AddCoffee() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [coffees, setCoffees] = useState([]) // existing coffees w/ brand name, for the dropdown
  const [loadingCoffees, setLoadingCoffees] = useState(true)
  const [selectedCoffeeId, setSelectedCoffeeId] = useState('') // '' = none picked yet, NEW_COFFEE = add new

  // New coffee fields
  const [brandInput, setBrandInput] = useState('')
  const [blend, setBlend] = useState('')
  const [roastType, setRoastType] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [existingBrandNames, setExistingBrandNames] = useState([])

  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('coffees')
      .select('id, blend, roast_type, photo_url, brands(id, name)')
      .then(({ data }) => {
        const sorted = (data || []).sort((a, b) => {
          const an = a.brands?.name || ''
          const bn = b.brands?.name || ''
          return an.localeCompare(bn) || (a.blend || '').localeCompare(b.blend || '')
        })
        setCoffees(sorted)
        setExistingBrandNames([...new Set(sorted.map(c => c.brands?.name).filter(Boolean))])
        setLoadingCoffees(false)
      })
  }, [])

  const selectedCoffee = coffees.find(c => c.id === selectedCoffeeId)

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedCoffeeId) { setError('Please choose a coffee'); return }
    if (selectedCoffeeId === NEW_COFFEE && !brandInput.trim()) { setError('Brand is required'); return }
    if (!score) { setError('Please set a score'); return }
    setError('')
    setLoading(true)

    try {
      let coffeeId = selectedCoffeeId

      if (selectedCoffeeId === NEW_COFFEE) {
        // 1. Get or create brand
        const brandName = brandInput.trim()
        let brandId
        const { data: existingBrand } = await supabase
          .from('brands')
          .select('id')
          .ilike('name', brandName)
          .maybeSingle()

        if (existingBrand) {
          brandId = existingBrand.id
        } else {
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

        // 3. Get or create the coffee (brand + blend pair)
        const blendVal = blend.trim() || null
        const { data: existingCoffee } = await supabase
          .from('coffees')
          .select('*')
          .eq('brand_id', brandId)
          .is(blendVal ? 'blend' : 'blend', blendVal)
          .maybeSingle()

        if (existingCoffee) {
          coffeeId = existingCoffee.id
          if (photo_url && !existingCoffee.photo_url) {
            await supabase.from('coffees').update({ photo_url, roast_type: roastType || existingCoffee.roast_type }).eq('id', existingCoffee.id)
          }
        } else {
          const { data, error: coffeeErr } = await supabase
            .from('coffees')
            .insert({ brand_id: brandId, blend: blendVal, roast_type: roastType || null, photo_url })
            .select()
            .single()
          if (coffeeErr) throw coffeeErr
          coffeeId = data.id
        }
      }

      // 4. Insert review against the chosen/created coffee
      const { error: reviewErr } = await supabase
        .from('reviews')
        .insert({ coffee_id: coffeeId, user_id: user.id, score: parseInt(score), notes: notes.trim() || null })
      if (reviewErr) throw reviewErr

      navigate(`/coffee/${coffeeId}`)
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

        {/* Coffee selector */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <p className="text-label" style={{ marginBottom: 'var(--space-4)' }}>Which Coffee?</p>

          <label className="input-label">Coffee *</label>
          <select
            className="input"
            value={selectedCoffeeId}
            onChange={e => setSelectedCoffeeId(e.target.value)}
            disabled={loadingCoffees}
          >
            <option value="">{loadingCoffees ? 'Loading…' : 'Select a coffee…'}</option>
            <option value={NEW_COFFEE}>+ Add a new coffee</option>
            {coffees.map(c => (
              <option key={c.id} value={c.id}>
                {c.brands?.name}{c.blend ? ` — ${c.blend}` : ''}
              </option>
            ))}
          </select>
          <p className="input-hint">
            Pick an existing coffee to add another review against it, or add a new one below.
          </p>

          {/* Existing coffee preview */}
          {selectedCoffee && (
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginTop: 'var(--space-4)' }}>
              {selectedCoffee.photo_url ? (
                <img src={selectedCoffee.photo_url} alt="" style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-parchment)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>☕</div>
              )}
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-espresso)' }}>
                  {selectedCoffee.brands?.name}
                </p>
                {selectedCoffee.blend && <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>{selectedCoffee.blend}</p>}
                {selectedCoffee.roast_type && <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>{selectedCoffee.roast_type}</p>}
              </div>
            </div>
          )}
        </div>

        {/* New coffee fields */}
        {selectedCoffeeId === NEW_COFFEE && (
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <p className="text-label" style={{ marginBottom: 'var(--space-4)' }}>New Coffee Details</p>
            <div style={sectionStyle}>

              <div>
                <label className="input-label">Brand *</label>
                <input
                  list="brands-list"
                  className="input"
                  value={brandInput}
                  onChange={e => setBrandInput(e.target.value)}
                  placeholder="e.g. Intelligentsia"
                />
                <datalist id="brands-list">
                  {existingBrandNames.map(b => <option key={b} value={b} />)}
                </datalist>
              </div>

              <div>
                <label className="input-label">Blend / Single Origin</label>
                <input
                  className="input"
                  value={blend}
                  onChange={e => setBlend(e.target.value)}
                  placeholder="e.g. Black Cat Classic Espresso"
                />
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
        )}

        {/* Review */}
        {selectedCoffeeId && (
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
        )}

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
