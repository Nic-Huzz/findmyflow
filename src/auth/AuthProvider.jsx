import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { initializeNotifications } from '../lib/notifications'
import { trackAccountCreated, getStoredUtmParams } from '../lib/analytics'

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

        // Track new signups (created_at ~= last_sign_in_at means first login)
        if (event === 'SIGNED_IN' && session?.user) {
          const created = new Date(session.user.created_at).getTime()
          const signedIn = new Date(session.user.last_sign_in_at).getTime()
          if (Math.abs(signedIn - created) < 60000) {
            trackAccountCreated({ userId: session.user.id, source: 'otp', ...getStoredUtmParams() })
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Initialize notifications when user is authenticated
  useEffect(() => {
    const setupNotifications = async () => {
      if (user) {
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
        if (vapidPublicKey) {
          await initializeNotifications(user.id, vapidPublicKey)
          console.log('🔔 Notifications initialized')
        }
      }
    }

    setupNotifications()
  }, [user])

  // Sign in with verification code
  // shouldCreateUser: true (default) for signup flows, false for login-only (AuthGate)
  const signInWithCode = async (email, { shouldCreateUser = true } = {}) => {
    try {
      setLoading(true)

      console.log('🔐 Sending verification code to:', email)

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser,
        }
      })

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      console.log('📧 Verification code sent to:', email)
      return { success: true, message: 'Check your email for the verification code!' }
    } catch (error) {
      console.error('❌ Code send error:', error)
      return { success: false, message: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Verify the code entered by user
  const verifyCode = async (email, token) => {
    try {
      setLoading(true)

      console.log('🔐 Verifying code for:', email)

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      })

      if (error) {
        console.error('❌ Verification error:', error)
        throw error
      }

      console.log('✅ Code verified successfully')
      return { success: true, user: data.user }
    } catch (error) {
      console.error('❌ Code verification error:', error)
      return { success: false, message: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Legacy magic link method (kept for backward compatibility)
  const signInWithMagicLink = async (email) => {
    try {
      setLoading(true)

      const redirectUrl = `${window.location.origin}/me`

      console.log('🔐 Attempting magic link for:', email)

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      })

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
    signInWithCode,
    verifyCode,
    signInWithMagicLink,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
