import { useState } from 'react'
import { Link } from 'react-router-dom'
import { signIn } from '../lib/auth'

const BURGUNDY = 'oklch(38% 0.13 25)'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'oklch(99% 0.008 80)',
        borderRadius: 28,
        padding: 40,
        boxShadow: '0 1px 2px rgba(40,20,10,0.06), 0 10px 24px -12px rgba(40,20,10,0.28)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ font: `400 40px/1 'Abril Fatface', serif`, color: BURGUNDY, marginBottom: 8 }}>
            WineYak
          </div>
          <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-muted)', letterSpacing: '0.02em' }}>
            coffee &amp; ice cream, tasted with joy
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              placeholder="••••••••"
              style={{ borderRadius: 12 }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 14, color: '#DC2626', fontWeight: 600 }}>{error}</p>
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
            {loading ? 'Signing in…' : 'Sign in'}
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
