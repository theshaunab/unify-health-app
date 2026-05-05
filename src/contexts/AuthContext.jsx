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

    const { data: profile, error } = await supabase
      .from('users')
      .select('id, name, email, tier, role, avatar_url, staff_role')
      .or(`id.eq.${authUser.id},email.eq.${email}`)
      .maybeSingle()

    if (error) {
      console.error('Profile fetch error:', error.message)
    }

    return {
      ...authUser,
      name: profile?.name || email?.split('@')[0] || 'Member',
      email: profile?.email || email,
      tier: profile?.tier || 'basic',
      role: profile?.role || 'member',
      staff_role: profile?.staff_role || null,
      avatar_url: profile?.avatar_url || null,
    }
  }

  const loadUser = async () => {
  const { data } = await supabase.auth.getUser()

  if (data?.user) {
    const session = await supabase.auth.getSession()
    const appUser = await buildUser(session.data.session)
    setUser(appUser)
  } else {
    setUser(null)
  }

  setLoading(false)
}

  useEffect(() => {
    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const appUser = await buildUser(session)
        setUser(appUser)
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (error) return { error }

    const appUser = await buildUser(data.session)
    setUser(appUser)

    return { error: null, user: appUser }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const refreshUser = async () => {
    await loadUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
