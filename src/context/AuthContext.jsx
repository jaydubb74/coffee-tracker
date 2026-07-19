import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    // Sets user immediately, then loads their profile (display name + admin flag)
    async function applySession(session) {
      const nextUser = session?.user ?? null
      setUser(nextUser)
      if (!nextUser) {
        setProfile(null)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, is_admin')
        .eq('id', nextUser.id)
        .maybeSingle()
      if (!cancelled) setProfile(data ?? null)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session).finally(() => {
        if (!cancelled) setLoading(false)
      })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    profile,
    isAdmin: profile?.is_admin === true,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
