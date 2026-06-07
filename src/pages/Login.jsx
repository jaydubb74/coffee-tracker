import { useState } from 'react'
import { Link } from 'react-router-dom'
import { signIn } from '../lib/auth'

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-7) 0' }}>
      <div className="card" style={{ width: '100%', maxWidth: 'var(--max-width-narrow)', padding: 'var(--space-7)' }}>

        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{ fontSize: 48, marginBottom: 'var(--space-3)' }}>☕</div>
          <h1 className="text-h2">Coffee Tracker</h1>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-caption)',
            letterSpacing: '1px',
            color: 'var(--color-roast-muted)',
            textTransform: 'uppercase',
            marginTop: 'var(--space-2)',
          }}>
            Josh &amp; Erin's brew log
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <label className="input-label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
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
            />
          </div>

          {error && (
            <p style={{ fontSize: 'var(--text-body-sm)', color: '#DC2626' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: 'var(--space-5)' }}>
          <Link to="/" style={{ color: 'var(--color-roast-light)', textDecoration: 'underline' }}>
            ← Back to coffee list
          </Link>
        </p>
      </div>
    </div>
  )
}
