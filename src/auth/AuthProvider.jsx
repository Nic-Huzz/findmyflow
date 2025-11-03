import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Sign in with magic link
  const signInWithMagicLink = async (email) => {
    try {
      setLoading(true)
      
      // Use current origin for redirect (works for both localhost and production)
      const redirectUrl = `${window.location.origin}/me`
      
      console.log('🔐 Attempting magic link for:', email)
      console.log('🔐 Redirect URL:', redirectUrl)
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      })
      
      console.log('📧 Supabase response:', { data, error })
      
      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }
      
      console.log('📧 Magic link sent to:', email)
      return { success: true, message: 'Check your email for the magic link!' }
    } catch (error) {
      console.error('❌ Magic link error:', error)
      return { success: false, message: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      console.log('👋 User signed out')
      return { success: true }
    } catch (error) {
      console.error('❌ Sign out error:', error)
      return { success: false, message: error.message }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    signInWithMagicLink,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
