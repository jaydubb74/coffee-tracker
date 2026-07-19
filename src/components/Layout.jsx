import { Link, useLocation } from 'react-router-dom'
import { signOut } from '../lib/auth'
import { useAuth } from '../context/auth-context'
import { CATEGORIES } from '../lib/categories'

const BURGUNDY = CATEGORIES.coffee.accent

export default function Layout({ children }) {
  const { user } = useAuth()
  const location = useLocation()

  const isHome = location.pathname === '/' && !location.search
  const isCoffee = location.pathname === '/reviews' && location.search.includes('category=coffee')
  const isIce = location.pathname === '/reviews' && location.search.includes('category=ice_cream')

  function pillStyle(active) {
    return {
      padding: '8px 18px',
      borderRadius: 999,
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
      fontWeight: 700,
      fontSize: 13,
      lineHeight: '1.4',
      textDecoration: 'none',
      transition: 'background 0.15s ease',
      background: active ? BURGUNDY : 'transparent',
      color: active ? 'oklch(97% 0.02 85)' : 'oklch(30% 0.02 40)',
      display: 'inline-block',
    }
  }

  return (
    <div style={{ minHeight: '100svh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--color-bg)', paddingBottom: 18 }}>
        <div className="header-inner" style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          maxWidth: 'var(--max-width-content)',
          margin: '0 auto',
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ font: `400 34px/1 'Abril Fatface', serif`, color: BURGUNDY }}>WineYak</span>
            <span style={{ font: `600 13px/1.4 'Nunito Sans', sans-serif`, color: 'var(--color-text-secondary)', letterSpacing: '0.02em' }}>
              coffee &amp; ice cream, tasted with joy
            </span>
          </Link>

          {/* Nav pills */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link to="/" style={pillStyle(isHome)}>Home</Link>
            <Link to="/reviews?category=coffee" style={pillStyle(isCoffee)}>Coffee</Link>
            <Link to="/reviews?category=ice_cream" style={pillStyle(isIce)}>Ice Cream</Link>
            {user ? (
              <>
                <Link to="/add" style={{ ...pillStyle(false), marginLeft: 8 }}>+ Review</Link>
                <button
                  onClick={() => signOut().catch(err => alert(`Sign out failed: ${err.message}`))}
                  style={{
                    marginLeft: 4,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Sign out
                </button>
              </>
            ) : location.pathname !== '/login' ? (
              <Link to="/login" style={{
                ...pillStyle(false),
                marginLeft: 8,
                border: `1.5px solid ${BURGUNDY}`,
                color: BURGUNDY,
                padding: '6px 18px',
              }}>
                Sign in
              </Link>
            ) : null}
          </div>
        </div>

        {/* Scallop bottom edge */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 18,
          background: 'var(--color-bg)',
          WebkitMaskImage: 'radial-gradient(circle at 9px 0, transparent 9px, black 9.5px)',
          maskImage: 'radial-gradient(circle at 9px 0, transparent 9px, black 9.5px)',
          WebkitMaskSize: '18px 18px',
          maskSize: '18px 18px',
          WebkitMaskRepeat: 'repeat-x',
          maskRepeat: 'repeat-x',
        }} />
      </div>

      {/* Main content */}
      <main className="site-main" style={{
        flex: 1,
        maxWidth: 'var(--max-width-content)',
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        {children}
      </main>

      {/* Footer */}
      <div className="site-footer" style={{ borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
        <span style={{ font: `600 12px/1.4 'Nunito Sans', sans-serif`, color: 'var(--color-text-muted)' }}>
          WineYak — a personal collection, tasted with joy.
        </span>
      </div>
    </div>
  )
}
