import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type Session, type User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  session: Session | null | any
  user: User | null | any
  loading: boolean
  signOut: () => Promise<void>
  isElectron: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    if (isElectron) {
      try {
        console.log('[Auth] Fetching local profile...')
        const electron = (window as any).electronAPI
        if (!electron) {
             setLoading(false)
             return
        }
        const profile = await electron.invoke('get-profile')
        if (profile) {
          console.log('[Auth] Profile found:', profile.name)
          const mockUser = {
            id: profile.id,
            email: profile.email,
            user_metadata: { name: profile.name },
          }
          setUser(mockUser as any)
          setSession({ user: mockUser } as any)
        } else {
          console.log('[Auth] No profile found in DB')
          setUser(null)
          setSession(null)
        }
      } catch (err) {
        console.error('[Auth] Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (isElectron) {
      refreshProfile()
      return
    }

    // Supabase Fallback
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    if (isElectron) {
      setUser(null)
      setSession(null)
      return
    }
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, isElectron, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
