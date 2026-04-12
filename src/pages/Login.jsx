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
    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-full border-2 border-brand-sage flex items-center justify-center mb-4">
            <span className="text-brand-sage font-bold text-2xl">U</span>
          </div>
          <h1 className="text-brand-offwhite font-semibold text-xl tracking-widest">UNIFY</h1>
          <p className="text-brand-offwhite/40 text-xs tracking-wide mt-1">Health &amp; Fitness</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-brand-offwhite/60 text-xs mb-1.5 tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-brand-surface border border-white/10 rounded-lg px-4 py-3 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-brand-offwhite/60 text-xs mb-1.5 tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-brand-surface border border-white/10 rounded-lg px-4 py-3 text-brand-offwhite text-sm focus:outline-none focus:border-brand-sage transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-sage text-brand-dark font-semibold py-3 rounded-lg text-sm tracking-wide hover:bg-brand-sage/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
