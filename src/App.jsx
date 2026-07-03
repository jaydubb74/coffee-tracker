import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Landing from './pages/Landing'
import ReviewFeed from './pages/ReviewFeed'
import ProductDetail from './pages/ProductDetail'
import AddReview from './pages/AddReview'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}

function LoginPage() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <Login />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/reviews" element={<ReviewFeed />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            {/* Legacy redirect for old coffee/:id URLs */}
            <Route path="/coffee/:id" element={<Navigate to="/reviews" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/add"
              element={
                <RequireAuth>
                  <AddReview />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  )
}
