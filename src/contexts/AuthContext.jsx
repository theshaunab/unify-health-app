import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const buildUser = async (session) => {
    if (!session?.user) return null

    const authUser = session.user
    const email = authUser.email?.toLowerCase()

    try {
      let { data: profile, error } = await supabase
        .from('users')
        .select('id, name, email, tier, role, avatar_url, staff_role')
        .eq('id', authUser.id)
        .maybeSingle()

      if (!profile && email) {
        const result = await supabase
          .from('users')
          .select('id, name, email, tier, role, avatar_url, staff_role')
          .eq('email', email)
          .maybeSingle()

        profile = result.data
        error = result.error
      }

      if (error) {
        console.warn('Profile fetch error:', error.message)
      }

      if (profile) {
        return {
          ...authUser,
          id: profile.id,
          email: profile.email || email,
          name: profile.name || email?.split('@')[0] || 'Member',
          tier: profile.tier || 'basic',
          role: profile.role || 'member',
          staff_role: profile.staff_role || null,
          avatar_url: profile.avatar_url || null,
        }
      }
    } catch (err) {
      console.warn('buildUser error:', err.message)
    }

    return {
      ...authUser,
      name: email?.split('@')[0] || 'Member',
      tier: 'basic',
      role: 'member',
      staff_role: null,
      avatar_url: null,
    }
  }

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        const u = await buildUser(session)
        setUser(u)
      }

      setLoading(false)
    }

    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const u = await buildUser(session)
          setUser(u)
        } else {
          setUser(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) return { error }

    const u = await buildUser(data.session)
    setUser(u)

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

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
