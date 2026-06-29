import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ScoreRing from '../components/ScoreRing'

const VALUE_PROPS = [
  {
    icon: '☕',
    title: 'Real Reviews. No Fluff.',
    body: 'Every rating on WineYak comes from people who actually bought and brewed the beans — not brands paying for placement. Community signal, nothing else.',
  },
  {
    icon: '🌎',
    title: 'Built for the West Coast',
    body: 'From Pacific Northwest micro-roasters to California specialty shops, we focus on what\'s actually accessible to you — local, regional, and ship-to-your-door options that matter to West Coast drinkers.',
  },
  {
    icon: '🫘',
    title: 'Whole Bean Only',
    body: 'We\'re not here for pre-ground. WineYak is purpose-built for the whole bean buyer — the person who cares about freshness, origin, roast profile, and brew method.',
  },
  {
    icon: '📊',
    title: 'Aggregated Ratings. Better Decisions.',
    body: 'One reviewer\'s opinion is noise. A hundred reviewers\' opinions is signal. WineYak aggregates across reviews to show you what consistently delivers — and what doesn\'t.',
  },
]

export default function Landing() {
  const [topCoffees, setTopCoffees] = useState([])
  const [loadingTop, setLoadingTop] = useState(true)

  useEffect(() => {
    async function loadTop() {
      const { data, error } = await supabase
        .from('coffees')
        .select(`
          id, blend, roast_type, photo_url,
          brands ( id, name ),
          reviews ( score )
        `)

      if (!error && data) {
        const withAvg = data
          .map(c => {
            const scores = (c.reviews || []).map(r => r.score)
            if (!scores.length) return null
            const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            return { ...c, avg, reviewCount: scores.length }
          })
          .filter(Boolean)
          .sort((a, b) => b.avg - a.avg)
          .slice(0, 4)

        setTopCoffees(withAvg)
      }
      setLoadingTop(false)
    }
    loadTop()
  }, [])

  return (
    <div>

      {/* ── HERO ── */}
      <section style={{
        background: 'var(--color-espresso)',
        margin: 'calc(-1 * var(--space-6)) calc(-1 * var(--space-4)) 0',
        padding: 'var(--space-9) var(--space-4) var(--space-8)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle background texture */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(107,58,42,0.4) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: 580, margin: '0 auto' }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-label)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--color-roast-muted)',
            marginBottom: 'var(--space-4)',
          }}>
            West Coast · Whole Bean · Community Rated
          </p>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 6vw, 52px)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-1px',
            color: '#FFFFFF',
            marginBottom: 'var(--space-5)',
          }}>
            The West Coast's Best<br />
            <span style={{ color: 'var(--color-roast-muted)', fontStyle: 'italic' }}>Whole Bean Coffees</span><br />
            Ranked by Real Drinkers
          </h1>

          <p style={{
            fontSize: 'var(--text-body)',
            lineHeight: 'var(--leading-relaxed)',
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 'var(--space-7)',
            maxWidth: 460,
            margin: '0 auto var(--space-7)',
          }}>
            Discover the beans worth buying — before you spend a dime. WineYak aggregates real reviews from real drinkers to surface the best roasters, the most-loved beans, and the hidden gems worth seeking out — from Seattle to San Diego.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/reviews" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--color-roast)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-semibold)',
              fontSize: 'var(--text-body-sm)',
              padding: '13px 26px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              boxShadow: '0 2px 12px rgba(107,58,42,0.5)',
              transition: 'all var(--transition-base)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#7C4535'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-roast)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              Browse Top-Rated Beans →
            </Link>
            <Link to="/add" style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'transparent',
              color: 'rgba(255,255,255,0.75)',
              fontFamily: 'var(--font-body)',
              fontWeight: 'var(--weight-medium)',
              fontSize: 'var(--text-body-sm)',
              padding: '13px 26px',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              textDecoration: 'none',
              transition: 'all var(--transition-base)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = '#FFFFFF' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
            >
              Submit a Review
            </Link>
          </div>
        </div>
      </section>

      {/* ── TOP RATED ── */}
      {!loadingTop && topCoffees.length > 0 && (
        <section style={{ padding: 'var(--space-8) 0 0' }}>
          <p className="text-label" style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            Top Rated Right Now
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {topCoffees.map((coffee, i) => (
              <Link
                key={coffee.id}
                to={`/coffee/${coffee.id}`}
                className="card"
                style={{
                  padding: 'var(--space-5)',
                  textDecoration: 'none',
                  color: 'inherit',
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute', top: 'var(--space-3)', left: 'var(--space-3)',
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 'var(--weight-medium)',
                  color: 'var(--color-roast-muted)', letterSpacing: 1,
                }}>
                  #{i + 1}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-3)' }}>
                  {coffee.photo_url ? (
                    <img
                      src={coffee.photo_url}
                      alt={coffee.blend || coffee.brands?.name}
                      style={{ width: 72, height: 72, borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: 72, height: 72, borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg-parchment)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                    }}>
                      ☕
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <p style={{
                    fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-semibold)',
                    fontSize: 'var(--text-h4)', color: 'var(--color-espresso)',
                  }}>
                    {coffee.brands?.name}
                  </p>
                  {coffee.blend && (
                    <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {coffee.blend}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-3)' }}>
                    <ScoreRing score={coffee.avg} size={48} />
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-text-muted)',
                    textTransform: 'uppercase', letterSpacing: 1, marginTop: 'var(--space-2)',
                  }}>
                    {coffee.reviewCount} review{coffee.reviewCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── VALUE PROPS ── */}
      <section style={{ padding: 'var(--space-8) 0' }}>
        <p className="text-label" style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          Why WineYak
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-4)',
        }}>
          {VALUE_PROPS.map(({ icon, title, body }) => (
            <div key={title} className="card" style={{ padding: 'var(--space-5)' }}>
              <div style={{ fontSize: 28, marginBottom: 'var(--space-3)' }}>{icon}</div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 'var(--weight-semibold)',
                fontSize: 'var(--text-h4)',
                color: 'var(--color-espresso)',
                marginBottom: 'var(--space-2)',
              }}>
                {title}
              </h3>
              <p style={{
                fontSize: 'var(--text-body-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
              }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section style={{
        background: 'var(--color-bg-parchment)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-7) var(--space-6)',
        margin: '0 0 var(--space-4)',
        textAlign: 'center',
        border: '1px solid var(--color-border-light)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 'var(--space-4)', color: 'var(--color-roast-muted)' }}>❝</div>
        <blockquote style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(18px, 3vw, 22px)',
          fontStyle: 'italic',
          lineHeight: 'var(--leading-relaxed)',
          color: 'var(--color-espresso)',
          maxWidth: 500,
          margin: '0 auto var(--space-4)',
        }}>
          I found three roasters I'd never heard of through WineYak. All three are now in my regular rotation.
        </blockquote>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-caption)',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'var(--color-roast-light)',
        }}>
          — WineYak Reviewer, Portland
        </p>
      </section>

    </div>
  )
}
