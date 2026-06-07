import { Link, useLocation } from 'react-router-dom'
import { signOut } from '../lib/auth'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || ''

  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-white border-b border-amber-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-amber-900 text-lg">
            <span>☕</span>
            <span>Coffee Tracker</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-amber-700">{displayName}</span>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-amber-600 hover:text-amber-900"
                >
                  Sign out
                </button>
              </>
            ) : !isLoginPage ? (
              <Link
                to="/login"
                className="text-xs bg-amber-800 text-white px-3 py-1.5 rounded-lg hover:bg-amber-900 transition-colors"
              >
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
