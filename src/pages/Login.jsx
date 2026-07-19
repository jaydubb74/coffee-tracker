import { useState } from 'react'
import { Link } from 'react-router-dom'
import { signIn, signUp } from '../lib/auth'
import { CATEGORIES } from '../lib/categories'

const BURGUNDY = CATEGORIES.coffee.accent

export default function Login() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const isSignup = mode === 'signup'

  function switchMode(next) {
    setMode(next)
    setError('')
    setNotice('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    if (isSignup && !displayName.trim()) {
      setError('Please enter a display name')
      return
    }
    setLoading(true)
    try {
      if (isSignup) {
        const { session } = await signUp(email, password, displayName.trim())
        // With email confirmation enabled there's no session yet
        if (!session) {
          setNotice('Almost there — check your email for a confirmation link, then sign in.')
          setMode('signin')
        }
        // If confirmation is disabled, the auth listener signs us in and
        // the router redirects away from this page automatically.
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const tabStyle = (active) => ({
    flex: 1,
    padding: '10px',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    fontSize: 13,
    background: active ? BURGUNDY : 'transparent',
    color: active ? 'oklch(97% 0.02 85)' : 'var(--color-text-secondary)',
    transition: 'background 0.15s ease',
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'oklch(99% 0.008 80)',
        borderRadius: 28,
        padding: 40,
        boxShadow: '0 1px 2px rgba(40,20,10,0.06), 0 10px 24px -12px rgba(40,20,10,0.28)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ font: `400 40px/1 'Abril Fatface', serif`, color: BURGUNDY, marginBottom: 8 }}>
            WineYak
          </div>
          <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-muted)', letterSpacing: '0.02em' }}>
            coffee &amp; ice cream, tasted with joy
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          background: 'var(--color-bg-parchment)', borderRadius: 999, padding: 4,
        }}>
          <button type="button" onClick={() => switchMode('signin')} style={tabStyle(!isSignup)}>
            Sign in
          </button>
          <button type="button" onClick={() => switchMode('signup')} style={tabStyle(isSignup)}>
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isSignup && (
            <div>
              <label className="input-label">Display Name</label>
              <input
                className="input"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
                maxLength={40}
                placeholder="How your name appears on reviews"
                style={{ borderRadius: 12 }}
              />
            </div>
          )}

          <div>
            <label className="input-label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{ borderRadius: 12 }}
            />
          </div>

          <div>
            <label className="input-label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              style={{ borderRadius: 12 }}
            />
            {isSignup && <p className="input-hint">At least 8 characters.</p>}
          </div>

          {error && (
            <p style={{ fontSize: 14, color: '#DC2626', fontWeight: 600 }}>{error}</p>
          )}
          {notice && (
            <p style={{ fontSize: 14, color: 'var(--color-positive)', fontWeight: 600 }}>{notice}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              padding: '14px',
              borderRadius: 999,
              background: BURGUNDY,
              color: 'oklch(97% 0.02 85)',
              fontFamily: 'var(--font-body)',
              fontWeight: 700, fontSize: 15,
              border: 'none', cursor: 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? (isSignup ? 'Creating account…' : 'Signing in…')
              : (isSignup ? 'Create account' : 'Sign in')}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', marginTop: 24, fontWeight: 600 }}>
          <Link to="/" style={{ color: BURGUNDY, textDecoration: 'underline' }}>
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
