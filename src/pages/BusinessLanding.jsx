import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticSuccess, hapticLight } from '../lib/haptics'
import './BusinessLanding.css'

export default function BusinessLanding() {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadyExpressed, setAlreadyExpressed] = useState(false)

  useEffect(() => {
    document.title = 'Scale Your Impact + Income'
  }, [])

  // Check if user has already expressed interest
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase
        .from('business_scale_interest')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      if (!cancelled && data) {
        setAlreadyExpressed(true)
        setSubmitted(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const handleExpressInterest = async () => {
    if (submitting || submitted) return
    hapticLight()
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
      const { error } = await supabase
        .from('business_scale_interest')
        .insert({ user_id: user.id })
      if (error) throw error
      hapticSuccess()
      setSubmitted(true)
    } catch (err) {
      console.error('Failed to record interest:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="business-landing">
      <div className="bl-orb bl-orb-1" />
      <div className="bl-orb bl-orb-2" />

      <div className="bl-container">
        <div className="bl-badge">Business</div>

        <h1 className="bl-headline">
          Ready to scale your<br />
          <span className="bl-gradient-text">impact + income?</span>
        </h1>

        <p className="bl-sub">
          You've built the self-knowledge. Now it's time to build the action
          that turns it into a life.
        </p>

        {!submitted ? (
          <button
            className="bl-cta"
            onClick={handleExpressInterest}
            disabled={submitting}
          >
            {submitting ? 'Sending...' : 'Click here to express interest in support to scale your impact + income'}
          </button>
        ) : (
          <div className="bl-confirmed">
            <div className="bl-check">✓</div>
            <h2>You're on the list</h2>
            <p>
              {alreadyExpressed
                ? "We've got your interest on file. We'll be in touch as this opens up."
                : "Thank you. We'll reach out personally as the next cohort opens."}
            </p>
          </div>
        )}

        <p className="bl-footnote">
          Something new is being shaped here. Express interest to help us build it for you.
        </p>
      </div>
    </div>
  )
}
