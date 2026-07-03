import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, normalizePrice } from '../lib/categories'

const NEW_PRODUCT = '__new__'
const SIZE_UNITS = {
  coffee: ['oz', 'lb', 'g'],
  ice_cream: ['oz', 'pint', 'qt'],
}

export default function AddReview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()

  const [category, setCategory] = useState('coffee')
  const cat = CATEGORIES[category]

  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState('')

  // New product fields
  const [brand, setBrand] = useState('')
  const [variant, setVariant] = useState('')
  const [roastType, setRoastType] = useState('')
  const [rawPrice, setRawPrice] = useState('')
  const [rawSize, setRawSize] = useState('')
  const [rawSizeUnit, setRawSizeUnit] = useState('oz')
  const [productNotes, setProductNotes] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  // Review fields
  const [rating, setRating] = useState('')
  const [reviewText, setReviewText] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reload products when category changes
  useEffect(() => {
    setLoadingProducts(true)
    setSelectedProductId('')
    supabase
      .from('products')
      .select('id, brand, variant, roast_type, image_url')
      .eq('category', category)
      .then(({ data }) => {
        const sorted = (data || []).sort((a, b) =>
          (a.brand || '').localeCompare(b.brand || '') ||
          (a.variant || '').localeCompare(b.variant || '')
        )
        setProducts(sorted)
        setLoadingProducts(false)
      })
  }, [category])

  const selectedProduct = products.find(p => p.id === selectedProductId)

  function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function handleCategoryChange(newCat) {
    setCategory(newCat)
    setRawSizeUnit(newCat === 'coffee' ? 'oz' : 'oz')
    setBrand('')
    setVariant('')
    setRoastType('')
    setRawPrice('')
    setRawSize('')
    setRawSizeUnit('oz')
    setProductNotes('')
    setPhoto(null)
    setPhotoPreview(null)
    setRating('')
    setReviewText('')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedProductId) { setError('Please choose a product'); return }
    if (selectedProductId === NEW_PRODUCT && !brand.trim()) { setError(`${cat.brandLabel} is required`); return }
    if (!rating) { setError('Please set a rating'); return }
    setError('')
    setLoading(true)

    try {
      let productId = selectedProductId

      if (selectedProductId === NEW_PRODUCT) {
        // Upload photo
        let image_url = null
        if (photo) {
          const ext = photo.name.split('.').pop()
          const path = `${Date.now()}.${ext}`
          const { error: uploadErr } = await supabase.storage
            .from('coffee-photos')
            .upload(path, photo)
          if (uploadErr) throw uploadErr
          const { data: { publicUrl } } = supabase.storage
            .from('coffee-photos')
            .getPublicUrl(path)
          image_url = publicUrl
        }

        const normalized_price = normalizePrice(
          rawPrice ? parseFloat(rawPrice) : null,
          rawSize ? parseFloat(rawSize) : null,
          rawSizeUnit,
          category
        )

        const variantVal = variant.trim() || null
        const brandVal = brand.trim()

        // Upsert product (handles race conditions if same brand/variant submitted twice)
        const { data: existing } = await supabase
          .from('products')
          .select('id, image_url')
          .eq('category', category)
          .eq('brand', brandVal)
          .is('variant', variantVal)
          .maybeSingle()

        if (existing) {
          productId = existing.id
          // Update image if we have one and they don't
          if (image_url && !existing.image_url) {
            await supabase.from('products').update({ image_url }).eq('id', existing.id)
          }
        } else {
          const { data, error: insertErr } = await supabase
            .from('products')
            .insert({
              category,
              brand: brandVal,
              variant: variantVal,
              image_url,
              raw_price: rawPrice ? parseFloat(rawPrice) : null,
              raw_size: rawSize ? parseFloat(rawSize) : null,
              raw_size_unit: rawSizeUnit || null,
              normalized_price,
              price_unit: cat.priceUnit,
              roast_type: roastType || null,
              notes: productNotes.trim() || null,
            })
            .select()
            .single()
          if (insertErr) throw insertErr
          productId = data.id
        }
      }

      // Insert review
      const { error: reviewErr } = await supabase
        .from('reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating: parseInt(rating),
          review_text: reviewText.trim() || null,
        })
      if (reviewErr) throw reviewErr

      navigate(`/product/${productId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sectionStyle = { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }

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

        {/* Category picker */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <p className="text-label" style={{ marginBottom: 'var(--space-4)' }}>Category</p>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {Object.entries(CATEGORIES).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleCategoryChange(key)}
                style={{
                  flex: 1,
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${category === key ? 'var(--color-roast)' : 'var(--color-border)'}`,
                  background: category === key ? 'var(--color-bg-parchment)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  fontWeight: category === key ? 'var(--weight-semibold)' : 'var(--weight-regular)',
                  color: category === key ? 'var(--color-espresso)' : 'var(--color-text-secondary)',
                  fontSize: 'var(--text-body-sm)',
                  transition: 'all var(--transition-fast)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}
              >
                <span style={{ fontSize: 28 }}>{cfg.emoji}</span>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product selector */}
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <p className="text-label" style={{ marginBottom: 'var(--space-4)' }}>Which {cat.label}?</p>

          <label className="input-label">{cat.label} *</label>
          <select
            className="input"
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
            disabled={loadingProducts}
          >
            <option value="">{loadingProducts ? 'Loading…' : `Select a ${cat.label.toLowerCase()}…`}</option>
            <option value={NEW_PRODUCT}>+ Add a new {cat.label.toLowerCase()}</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.brand}{p.variant ? ` — ${p.variant}` : ''}
              </option>
            ))}
          </select>
          <p className="input-hint">
            Pick an existing entry to add another review, or add a new one below.
          </p>

          {/* Existing product preview */}
          {selectedProduct && (
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginTop: 'var(--space-4)' }}>
              {selectedProduct.image_url ? (
                <img src={selectedProduct.image_url} alt="" style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-parchment)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {cat.emoji}
                </div>
              )}
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-espresso)' }}>
                  {selectedProduct.brand}
                </p>
                {selectedProduct.variant && <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>{selectedProduct.variant}</p>}
                {selectedProduct.roast_type && <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)' }}>{selectedProduct.roast_type}</p>}
              </div>
            </div>
          )}
        </div>

        {/* New product fields */}
        {selectedProductId === NEW_PRODUCT && (
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <p className="text-label" style={{ marginBottom: 'var(--space-4)' }}>New {cat.label} Details</p>
            <div style={sectionStyle}>

              <div>
                <label className="input-label">{cat.brandLabel} *</label>
                <input
                  className="input"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder={`e.g. ${category === 'coffee' ? 'Intelligentsia' : 'Jeni\'s Splendid'}`}
                />
              </div>

              <div>
                <label className="input-label">{cat.variantLabel}</label>
                <input
                  className="input"
                  value={variant}
                  onChange={e => setVariant(e.target.value)}
                  placeholder={cat.variantPlaceholder}
                />
              </div>

              {cat.roastTypes && (
                <div>
                  <label className="input-label">Roast Type</label>
                  <select className="input" value={roastType} onChange={e => setRoastType(e.target.value)}>
                    <option value="">Select roast…</option>
                    {cat.roastTypes.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}

              {/* Price */}
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Price ($)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={rawPrice}
                    onChange={e => setRawPrice(e.target.value)}
                    placeholder="e.g. 19.00"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Size</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={rawSize}
                      onChange={e => setRawSize(e.target.value)}
                      placeholder="e.g. 12"
                      style={{ flex: 1 }}
                    />
                    <select
                      className="input"
                      value={rawSizeUnit}
                      onChange={e => setRawSizeUnit(e.target.value)}
                      style={{ width: 72 }}
                    >
                      {SIZE_UNITS[category].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              {rawPrice && rawSize && (
                <p className="input-hint">
                  Normalized: ${normalizePrice(parseFloat(rawPrice), parseFloat(rawSize), rawSizeUnit, category)?.toFixed(2)} {cat.priceUnitLabel}
                </p>
              )}

              <div>
                <label className="input-label">Product Notes</label>
                <textarea
                  className="input"
                  value={productNotes}
                  onChange={e => setProductNotes(e.target.value)}
                  rows={2}
                  placeholder={cat.notesPlaceholder}
                  style={{ resize: 'none' }}
                />
              </div>

              <div>
                <label className="input-label">Photo</label>
                {photoPreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={photoPreview} alt="preview" style={{ width: 120, height: 120, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                      style={{ position: 'absolute', top: -8, right: -8, background: '#DC2626', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >×</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current.click()}
                    style={{ width: '100%', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', background: 'var(--color-bg)', color: 'var(--color-text-muted)', fontSize: 'var(--text-body-sm)', fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'border-color var(--transition-fast)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-roast-muted)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    Tap to upload a photo
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              </div>
            </div>
          </div>
        )}

        {/* Review */}
        {selectedProductId && (
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <p className="text-label" style={{ marginBottom: 'var(--space-4)' }}>Your Review *</p>
            <div style={sectionStyle}>

              <div>
                <label className="input-label">
                  Rating (1–100)
                  {rating && (
                    <span style={{ marginLeft: 10, fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)', fontSize: 22, color: 'var(--color-roast)' }}>
                      {rating}
                    </span>
                  )}
                </label>
                <input
                  type="range" min="1" max="100"
                  value={rating || 75}
                  onChange={e => setRating(e.target.value)}
                  onMouseDown={() => !rating && setRating('75')}
                  onTouchStart={() => !rating && setRating('75')}
                  style={{ width: '100%', accentColor: 'var(--color-roast)', margin: '8px 0 4px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                  <span>1</span><span>50</span><span>100</span>
                </div>
                {!rating && <p className="input-hint">Move the slider to set your rating</p>}
              </div>

              <div>
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
