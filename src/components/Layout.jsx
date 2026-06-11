import { Link, useLocation } from 'react-router-dom'
import { signOut } from '../lib/auth'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || ''

  return (
    <div style={{ minHeight: '100svh', background: 'var(--color-bg)' }}>
      <header style={{
        background: 'var(--color-espresso)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          maxWidth: 'var(--max-width-content)',
          margin: '0 auto',
          padding: '0 var(--space-4)',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            textDecoration: 'none',
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--weight-semibold)',
            fontSize: 20,
            color: 'var(--color-bg)',
            letterSpacing: '-0.3px',
          }}>
            ☕ Coffee Tracker
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <Link to="/reviews" style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-body-sm)',
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.95)'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
            >
              Reviews
            </Link>
            {user ? (
              <>
                <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-roast-muted)' }}>
                  {displayName}
                </span>
                <button
                  onClick={() => signOut()}
                  style={{
                    fontSize: 'var(--text-caption)',
                    color: 'rgba(255,255,255,0.5)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.85)'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
                >
                  Sign out
                </button>
              </>
            ) : !isLoginPage ? (
              <Link to="/login" className="btn btn-sm" style={{
                background: 'var(--color-roast)',
                color: 'var(--color-bg)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                fontWeight: 'var(--weight-medium)',
                textDecoration: 'none',
              }}>
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main style={{
        maxWidth: 'var(--max-width-content)',
        margin: '0 auto',
        padding: 'var(--space-6) var(--space-4)',
      }}>
        {children}
      </main>
    </div>
  )
}
