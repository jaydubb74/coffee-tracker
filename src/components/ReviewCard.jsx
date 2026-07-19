import { Link } from 'react-router-dom'
import { categoryOf } from '../lib/categories'

export default function ReviewCard({ product, avg }) {
  const cat = categoryOf(product)
  const accentColor = cat.accent
  const categoryLabel = cat.label
  const display = avg == null ? null : (avg / 10).toFixed(1)

  const tags = product.roast_type ? [product.roast_type] : []

  return (
    <Link
      to={`/product/${product.id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        background: 'oklch(99% 0.008 80)',
        borderRadius: 22,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(40,20,10,0.06), 0 10px 24px -12px rgba(40,20,10,0.28)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        textDecoration: 'none',
        fontFamily: 'var(--font-body)',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(40,20,10,0.08), 0 18px 32px -14px rgba(40,20,10,0.36)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(40,20,10,0.06), 0 10px 24px -12px rgba(40,20,10,0.28)'
      }}
    >
      {/* Image area */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', flexShrink: 0, background: 'oklch(93% 0.02 78)' }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.variant || product.brand}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
            {cat.emoji}
          </div>
        )}

        {/* Scallop bottom on image */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: -1, height: 16,
          background: 'oklch(99% 0.008 80)',
          WebkitMaskImage: 'radial-gradient(circle at 8px 0, transparent 8px, black 8.5px)',
          maskImage: 'radial-gradient(circle at 8px 0, transparent 8px, black 8.5px)',
          WebkitMaskSize: '16px 16px',
          maskSize: '16px 16px',
          WebkitMaskRepeat: 'repeat-x',
          maskRepeat: 'repeat-x',
        }} />

        {/* Category badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          padding: '4px 12px',
          borderRadius: 999,
          background: accentColor,
          color: 'oklch(98% 0.01 90)',
          fontWeight: 700,
          fontSize: 11,
          lineHeight: '1.4',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          {categoryLabel}
        </div>

        {/* Score circle */}
        {display && (
          <div style={{
            position: 'absolute', bottom: 14, right: 14,
            width: 52, height: 52,
            borderRadius: '50%',
            background: 'var(--color-gold)',
            border: '3px solid oklch(99% 0.008 80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(40,20,10,0.25)',
          }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'oklch(26% 0.05 50)', lineHeight: 1 }}>
              {display}
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <div style={{ font: `400 21px/1.15 'Abril Fatface', serif`, color: 'oklch(24% 0.02 40)' }}>
          {product.variant || product.brand}
        </div>
        <div style={{
          fontWeight: 700, fontSize: 11, lineHeight: '1.4',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: accentColor,
        }}>
          {product.brand}
        </div>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {tags.map(tag => (
              <span key={tag} style={{
                fontWeight: 600, fontSize: 11, lineHeight: '1.4',
                color: 'oklch(24% 0.02 40)',
                background: 'oklch(94% 0.02 75)',
                padding: '3px 10px', borderRadius: 999,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
