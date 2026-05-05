import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error, user } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (user?.role === 'admin') {
      navigate('/admin')
    } else {
      if (user?.role === 'admin') {
  navigate('/admin')
} else {
  navigate('/')
}
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-brand-sage text-brand-dark flex items-center justify-center font-bold text-xl">
            U
          </div>
          <h1 className="text-brand-offwhite text-2xl font-bold">UNIFY</h1>
          <p className="text-brand-offwhite/40 text-sm">Health & Fitness</p>
        </div>

        <div>
          <label className="text-brand-offwhite/50 text-xs block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-brand-surface border border-white/10 rounded-lg px-4 py-3 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage transition-colors"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="text-brand-offwhite/50 text-xs block mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-brand-surface border border-white/10 rounded-lg px-4 py-3 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage transition-colors"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-sage text-brand-dark font-semibold py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
