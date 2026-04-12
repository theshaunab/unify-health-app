import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Demo mode: auto-login with a mock user so app is fully viewable
    const demoUser = {
      id: 'demo-user-1',
      email: 'shauna@unifyhealth.com',
      name: 'Shauna Brown',
      tier: 'full_access',
      role: 'admin',
      avatar_url: null,
    }
    setUser(demoUser)
    setLoading(false)
  }, [])

  const signIn = async (email, password) => {
    // In real app: const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    // For demo, accept any credentials
    setUser({
      id: 'demo-user-1',
      email,
      name: email.split('@')[0],
      tier: 'full_access',
      role: email.includes('admin') ? 'admin' : 'member',
      avatar_url: null,
    })
    return { error: null }
  }

  const signOut = async () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
