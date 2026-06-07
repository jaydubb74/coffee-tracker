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
    <div className="flex items-center justify-center py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">☕</div>
          <h1 className="text-2xl font-bold text-amber-900">Coffee Tracker</h1>
          <p className="text-amber-700 text-sm mt-1">Josh &amp; Erin's brew log</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-amber-900 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-amber-400 mt-4">
          <Link to="/" className="underline hover:text-amber-700">← Back to coffee list</Link>
        </p>
      </div>
    </div>
  )
}
