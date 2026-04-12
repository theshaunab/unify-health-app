import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TodaysWorkout from './pages/TodaysWorkout'
import Admin from './pages/Admin'
import BodyComposition from './pages/BodyComposition'
import Programs from './pages/Programs'

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen bg-brand-dark text-brand-offwhite">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="workout" element={<TodaysWorkout />} />
            <Route path="body-composition" element={<BodyComposition />} />
            <Route path="programs" element={<Programs />} />
            <Route path="admin" element={<PrivateRoute adminOnly><Admin /></PrivateRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
