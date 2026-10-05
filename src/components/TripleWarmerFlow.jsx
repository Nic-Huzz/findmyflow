/**
 * TripleWarmerFlow — Identity installation via I AM tapping.
 * 2-screen guided flow: Setup → Declarations + Done.
 * Pulls personalised declarations from user's essence, weekly focus, and identity declaration.
 *
 * CSS prefix: twf-
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getWeekStartLocal } from '../lib/dateUtils'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import confetti from 'canvas-confetti'
import './TripleWarmerFlow.css'

export default function TripleWarmerFlow({ userId, onComplete, onClose }) {
  const [step, setStep] = useState(1)
  const [essenceName, setEssenceName] = useState(null)
  const [focusText, setFocusText] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function fetchData() {
      // Fetch essence archetype
      const { data: profile } = await supabase
        .from('lead_flow_profiles')
        .select('custom_essence_name, essence_archetype')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!cancelled && profile) {
        setEssenceName(profile.custom_essence_name || profile.essence_archetype)
      }

      // Fetch weekly focus intention OR identity declaration
      const { data: reviewData } = await supabase
        .from('weekly_reviews')
        .select('identity_declaration')
        .eq('user_id', userId)
        .not('identity_declaration', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!cancelled && reviewData?.identity_declaration) {
        setFocusText(reviewData.identity_declaration)
      } else {
        // Fallback to weekly focus intention
        const { data: focusData } = await supabase
          .from('quest_completions')
          .select('response_data')
          .eq('user_id', userId)
          .eq('quest_id', 'rewire_weekly_focus')
          .gte('completed_at', getWeekStartLocal())
          .order('completed_at', { ascending: true })
          .limit(5)

        if (!cancelled && focusData?.length) {
          const setup = focusData.find(r => {
            const rd = r.response_data
            return rd?.quest_type === 'weekly_focus_setup'
          })
          if (setup?.response_data?.intention) {
            setFocusText(`I am someone who ${setup.response_data.intention.toLowerCase()}`)
          }
        }
      }

      if (!cancelled) setLoading(false)
    }

    fetchData().catch(() => setLoading(false))
    return () => { cancelled = true }
  }, [userId])

  function handleDone() {
    if (completing) return
    setCompleting(true)
    hapticSuccess()
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 }, ticks: 100, gravity: 1.4, scalar: 0.8 })
    onComplete?.()
  }

  if (loading) {
    return (
      <div className="twf-overlay" onClick={onClose}>
        <div className="twf-modal" onClick={e => e.stopPropagation()}>
          <div className="twf-loading"><div className="spinner" /></div>
        </div>
      </div>
    )
  }

  // Build declarations
  const declarations = []
  if (essenceName) declarations.push(`I am ${essenceName}.`)
  declarations.push('I am enough.')
  if (focusText) {
    // If it already starts with "I am", use as-is; otherwise wrap it
    const decl = focusText.toLowerCase().startsWith('i am')
      ? focusText.charAt(0).toUpperCase() + focusText.slice(1)
      : `I am someone who ${focusText.charAt(0).toLowerCase() + focusText.slice(1)}`
    // Remove trailing period if present, then add one
    declarations.push(decl.replace(/\.$/, '') + '.')
  }

  return (
    <div className="twf-overlay" onClick={onClose}>
      <div className="twf-modal" onClick={e => e.stopPropagation()}>
        <button className="twf-close" onClick={onClose}>&times;</button>

        {step === 1 && (
          <div className="twf-screen">
            <h3 className="twf-title">I AM Tapping</h3>
            <p className="twf-copy">
              Tap gently between your ring and pinky finger knuckles while saying each statement out loud.
            </p>
            <div className="twf-hand-hint">
              <span className="twf-hand-emoji">✋</span>
              <span className="twf-hand-label">Between 4th and 5th knuckle</span>
            </div>
            <button
              type="button"
              className="twf-start"
              onClick={() => { hapticLight(); setStep(2) }}
            >
              Start
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="twf-screen">
            <div className="twf-declarations">
              {declarations.map((d, i) => (
                <div key={i} className="twf-declaration">
                  {d}
                </div>
              ))}
            </div>
            <p className="twf-instruction">Say each one out loud while tapping. Take your time.</p>
            <button type="button" className="twf-done" disabled={completing} onClick={handleDone}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
