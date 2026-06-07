import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import CoffeeList from './pages/CoffeeList'
import CoffeeDetail from './pages/CoffeeDetail'
import AddCoffee from './pages/AddCoffee'

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
            <Route path="/" element={<CoffeeList />} />
            <Route path="/coffee/:id" element={<CoffeeDetail />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/add"
              element={
                <RequireAuth>
                  <AddCoffee />
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
