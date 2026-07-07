import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ReviewCard from '../components/ReviewCard'

const BURGUNDY = 'oklch(38% 0.13 25)'
const FOREST = 'oklch(40% 0.09 155)'

export default function Landing() {
  const [counts, setCounts] = useState({ coffee: 0, ice_cream: 0 })
  const [topRated, setTopRated] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('id, category, brand, variant, roast_type, image_url, reviews(rating)')

      if (!data) return

      const coffee = data.filter(p => p.category === 'coffee').length
      const ice_cream = data.filter(p => p.category === 'ice_cream').length
      setCounts({ coffee, ice_cream })

      const ranked = data
        .map(p => {
          const ratings = (p.reviews || []).map(r => r.rating)
          if (!ratings.length) return null
          const avg = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
          return { ...p, avg }
        })
        .filter(Boolean)
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 4)

      setTopRated(ranked)
    }
    load()
  }, [])

  return (
    <div>
      {/* Hero */}
      <div style={{
        background: BURGUNDY,
        borderRadius: 28,
        padding: '52px 56px',
        marginTop: 8,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 560, position: 'relative', zIndex: 1 }}>
          <div style={{ font: `400 46px/1.1 'Abril Fatface', serif`, color: 'oklch(97% 0.02 85)' }}>
            The good stuff, tasted first.
          </div>
          <div style={{
            font: `600 16px/1.6 'Nunito Sans', sans-serif`,
            color: 'oklch(90% 0.03 85)',
            marginTop: 16,
          }}>
            A running list of the whole-bean coffees and pints of ice cream worth buying —
            scored, noted, and kept here so you stop forgetting what to buy again.
          </div>
        </div>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', right: -40, bottom: -60, width: 220, height: 220, borderRadius: '50%', background: 'oklch(45% 0.13 25)' }} />
        <div style={{ position: 'absolute', right: 60, top: -50, width: 120, height: 120, borderRadius: '50%', background: 'oklch(78% 0.13 85)', opacity: 0.85 }} />
      </div>

      {/* Category cards */}
      <div style={{ display: 'flex', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
        <Link to="/reviews?category=coffee" style={{
          flex: 1, minWidth: 260, textDecoration: 'none',
          background: BURGUNDY, borderRadius: 22, padding: '28px 30px',
          color: 'oklch(97% 0.02 85)', display: 'flex', flexDirection: 'column', gap: 8,
          transition: 'transform 0.18s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ font: `400 28px/1.1 'Abril Fatface', serif` }}>Coffee</div>
          <div style={{ font: `600 13px/1.5 'Nunito Sans', sans-serif`, opacity: 0.85 }}>
            {counts.coffee} whole-bean {counts.coffee === 1 ? 'entry' : 'entries'}
          </div>
          <div style={{ font: `700 13px/1.4 'Nunito Sans', sans-serif`, marginTop: 14, letterSpacing: '0.03em' }}>
            Browse coffee →
          </div>
        </Link>

        <Link to="/reviews?category=ice_cream" style={{
          flex: 1, minWidth: 260, textDecoration: 'none',
          background: FOREST, borderRadius: 22, padding: '28px 30px',
          color: 'oklch(97% 0.02 85)', display: 'flex', flexDirection: 'column', gap: 8,
          transition: 'transform 0.18s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ font: `400 28px/1.1 'Abril Fatface', serif` }}>Ice Cream</div>
          <div style={{ font: `600 13px/1.5 'Nunito Sans', sans-serif`, opacity: 0.85 }}>
            {counts.ice_cream} {counts.ice_cream === 1 ? 'pint' : 'pints'} in the catalog
          </div>
          <div style={{ font: `700 13px/1.4 'Nunito Sans', sans-serif`, marginTop: 14, letterSpacing: '0.03em' }}>
            Browse ice cream →
          </div>
        </Link>
      </div>

      {/* Top rated */}
      {topRated.length > 0 && (
        <div style={{ marginTop: 52 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 22 }}>
            <div style={{ font: `400 30px/1.1 'Abril Fatface', serif`, color: 'oklch(24% 0.02 40)' }}>
              Top rated
            </div>
            <div style={{ font: `600 13px/1.4 'Nunito Sans', sans-serif`, color: 'var(--color-text-secondary)' }}>
              across everything reviewed
            </div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 22,
          }}>
            {topRated.map(p => <ReviewCard key={p.id} product={p} avg={p.avg} />)}
          </div>
        </div>
      )}

      {/* Add review CTA */}
      <div style={{ marginTop: 52, textAlign: 'center' }}>
        <Link to="/add" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: BURGUNDY,
          color: 'oklch(97% 0.02 85)',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: 14,
          padding: '13px 28px',
          borderRadius: 999,
          textDecoration: 'none',
          boxShadow: '0 2px 12px rgba(40,20,10,0.25)',
          transition: 'transform 0.15s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Submit a Review →
        </Link>
      </div>
    </div>
  )
}
