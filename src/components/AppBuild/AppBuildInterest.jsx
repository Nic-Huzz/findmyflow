/**
 * AppBuildInterest.jsx — Simple interest capture page for Build Your App
 *
 * Route: /create/build-app/interest
 * Single screen: headline + CTA to express interest (saves to DB)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../auth/AuthProvider'
import './AppBuildInterest.css'

export default function AppBuildInterest() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Check if interest was already expressed
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('app_build_prework')
      .select('responses')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.responses?.interest_expressed) setSubmitted(true)
      })
  }, [user?.id])

  async function handleExpressInterest() {
    if (!user?.id || submitting) return
    setSubmitting(true)

    // Merge interest flag into existing responses (don't overwrite prework data)
    const { data: existing } = await supabase
      .from('app_build_prework')
      .select('responses')
      .eq('user_id', user.id)
      .maybeSingle()

    const merged = { ...(existing?.responses || {}), interest_expressed: true, expressed_at: new Date().toISOString() }

    const { error } = await supabase
      .from('app_build_prework')
      .upsert({
        user_id: user.id,
        responses: merged
      }, { onConflict: 'user_id' })

    if (error) console.error('Error saving interest:', error)
    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <div className="app-build-interest">
      <button className="abi-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="abi-card">
        <div className="abi-emoji">🔨</div>
        <h1 className="abi-title">
          Keen to scale your impact + income by building an app?
        </h1>
        <p className="abi-desc">
          We're building a guided flow that takes you from idea to live product
          in a single session. No coding experience needed. Claude Code does the heavy lifting.
        </p>

        {submitted ? (
          <div className="abi-confirmed">
            <span className="abi-check">✓</span>
            <p>You're on the list! We'll let you know when it's ready.</p>
          </div>
        ) : (
          <button
            className="abi-cta"
            onClick={handleExpressInterest}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'I\'m interested'}
          </button>
        )}
      </div>
    </div>
  )
}
