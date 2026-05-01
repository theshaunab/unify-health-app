import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const buildUser = async (session) => {
    if (!session?.user) return null

    try {
      // Try fetching profile up to 3 times (RLS can cause race conditions)
      let profile = null
      for (let i = 0; i < 3; i++) {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, tier, role, avatar_url, staff_role')
          .eq('id', session.user.id)
          .maybeSingle()

        if (data) { profile = data; break }
        if (error) console.warn('Profile fetch attempt', i + 1, error.message)
        await new Promise(r => setTimeout(r, 300))
      }

      if (profile) {
        return {
          ...session.user,
          name:       profile.name       || session.user.email?.split('@')[0] || 'Member',
          tier:       profile.tier       || 'basic',
          role:       profile.role       || 'member',
          staff_role: profile.staff_role || null,
          avatar_url: profile.avatar_url || null,
        }
      }
    } catch (err) {
      console.warn('buildUser error:', err.message)
    }

    // Fallback
    return {
      ...session.user,
      name:       session.user.email?.split('@')[0] || 'Member',
      tier:       'basic',
      role:       'member',
      staff_role: null,
      avatar_url: null,
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const u = await buildUser(session)
        setUser(u)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const u = await buildUser(session)
        setUser(u)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error }
    const u = await buildUser(data.session)
    setUser(u)
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // Allow refreshing user profile manually
  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const u = await buildUser(session)
      setUser(u)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
