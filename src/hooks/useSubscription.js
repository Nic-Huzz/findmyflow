/**
 * useSubscription — React hook for checking user payment status
 *
 * Fetches once on mount, re-fetches on window focus (catches post-checkout return).
 * Returns: { hasSubscription, loading, plan, refresh }
 */
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { checkSubscription } from '../lib/subscriptionService'

export function useSubscription() {
  const { user } = useAuth()
  const [hasSubscription, setHasSubscription] = useState(false)
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState(null)

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setHasSubscription(false)
      setLoading(false)
      return
    }
    setLoading(true)
    const result = await checkSubscription(user.id)
    setHasSubscription(result.active)
    setPlan(result.plan)
    setLoading(false)
  }, [user?.id])

  // Fetch on mount
  useEffect(() => {
    refresh()
  }, [refresh])

  // Re-fetch on window focus (user returning from Stripe Checkout)
  useEffect(() => {
    const handleFocus = () => refresh()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refresh])

  return { hasSubscription, loading, plan, refresh }
}
