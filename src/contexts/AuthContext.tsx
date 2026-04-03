import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import supabase from '../lib/supabase'
import { signOut as authSignOut } from '../lib/auth'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'client'
}

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({ user: null, profile: null, loading: true, isAdmin: false, signOut: async () => {} })

export function useAuth() { return useContext(AuthContext) }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
    setProfile(data as Profile | null)
  }

  useEffect(() => {
    let profileUid: string | null = null

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        profileUid = session.user.id
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null
      setUser(session?.user ?? null)
      if (uid && uid !== profileUid) { profileUid = uid; fetchProfile(uid) }
      else if (!uid) { profileUid = null; setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => { await authSignOut(); setUser(null); setProfile(null) }

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin: profile?.role === 'admin', signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}
