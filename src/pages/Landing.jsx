import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ReviewCard from '../components/ReviewCard'
import { CATEGORIES, averageRating } from '../lib/categories'

const BURGUNDY = CATEGORIES.coffee.accent
const FOREST = CATEGORIES.ice_cream.accent

function TopSection({ title, subtitle, accentColor, browseHref, items }) {
  return (
    <div style={{
      background: 'oklch(99% 0.008 80)',
      borderRadius: 24,
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(40,20,10,0.06), 0 10px 24px -12px rgba(40,20,10,0.18)',
    }}>
      {/* Section header */}
      <div style={{ background: accentColor, padding: '22px 28px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ font: `400 28px/1.1 'Abril Fatface', serif`, color: 'oklch(97% 0.02 85)' }}>{title}</div>
          <div style={{ font: `600 13px/1.5 'Nunito Sans', sans-serif`, color: 'oklch(90% 0.03 85)', marginTop: 4 }}>{subtitle}</div>
        </div>
        <Link to={browseHref} style={{
          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
          color: 'oklch(97% 0.02 85)', textDecoration: 'none',
          whiteSpace: 'nowrap', opacity: 0.85,
        }}>
          See all →
        </Link>
      </div>

      {/* Cards */}
      <div style={{ padding: 20 }}>
        {items.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '32px 0', fontWeight: 600, fontSize: 14, color: 'var(--color-text-muted)' }}>
            No reviews yet — be the first!
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {items.map(p => <ReviewCard key={p.id} product={p} avg={p.avg} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Landing() {
  const [counts, setCounts] = useState({ coffee: 0, ice_cream: 0 })
  const [topCoffee, setTopCoffee] = useState([])
  const [topIce, setTopIce] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('id, category, brand, variant, roast_type, image_url, reviews(rating)')

      if (!data) return

      setCounts({
        coffee: data.filter(p => p.category === 'coffee').length,
        ice_cream: data.filter(p => p.category === 'ice_cream').length,
      })

      const ranked = data
        .map(p => ({ ...p, avg: averageRating(p.reviews) }))
        .filter(p => p.avg != null)
        .sort((a, b) => b.avg - a.avg)

      setTopCoffee(ranked.filter(p => p.category === 'coffee').slice(0, 5))
      setTopIce(ranked.filter(p => p.category === 'ice_cream').slice(0, 5))
    }
    load()
  }, [])

  return (
    <div>
      {/* Hero */}
      <div className="hero-card" style={{
        background: BURGUNDY,
        borderRadius: 28,
        marginTop: 8,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 560, position: 'relative', zIndex: 1 }}>
          <div className="hero-title" style={{ fontFamily: `'Abril Fatface', serif`, fontWeight: 400, lineHeight: 1.1, color: 'oklch(97% 0.02 85)' }}>
            The good stuff, tasted first.
          </div>
          <div style={{ font: `600 16px/1.6 'Nunito Sans', sans-serif`, color: 'oklch(90% 0.03 85)', marginTop: 16 }}>
            A running list of the whole-bean coffees and pints of ice cream worth buying —
            scored, noted, and kept here so you stop forgetting what to buy again.
          </div>
        </div>
        <div style={{ position: 'absolute', right: -40, bottom: -60, width: 220, height: 220, borderRadius: '50%', background: 'oklch(45% 0.13 25)' }} />
        <div style={{ position: 'absolute', right: 60, top: -50, width: 120, height: 120, borderRadius: '50%', background: 'oklch(78% 0.13 85)', opacity: 0.85 }} />
      </div>

      {/* Top Coffee */}
      <div style={{ marginTop: 40 }}>
        <TopSection
          title="Top Coffee"
          subtitle={`${counts.coffee} whole-bean ${counts.coffee === 1 ? 'entry' : 'entries'} in the catalog`}
          accentColor={BURGUNDY}
          browseHref="/reviews?category=coffee"
          items={topCoffee}
        />
      </div>

      {/* Top Ice Cream */}
      <div style={{ marginTop: 28 }}>
        <TopSection
          title="Top Ice Cream"
          subtitle={`${counts.ice_cream} ${counts.ice_cream === 1 ? 'pint' : 'pints'} in the catalog`}
          accentColor={FOREST}
          browseHref="/reviews?category=ice_cream"
          items={topIce}
        />
      </div>

      {/* Submit CTA */}
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <Link to="/add" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: BURGUNDY, color: 'oklch(97% 0.02 85)',
          fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
          padding: '13px 28px', borderRadius: 999, textDecoration: 'none',
          boxShadow: '0 2px 12px rgba(40,20,10,0.25)', transition: 'transform 0.15s ease',
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
