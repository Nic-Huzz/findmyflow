/**
 * JourneyTimeline — Completed hero stages above current stage.
 * Each completed stage shows: name + date + what they did.
 * CSS prefix: jtl-
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './JourneyTimeline.css'

const HERO_STAGES = [
  { stage: 1, name: 'Ordinary World', icon: '🏢' },
  { stage: 2, name: 'Call to Adventure', icon: '⚡' },
  { stage: 3, name: 'Refusal of the Call', icon: '💭' },
  { stage: 4, name: 'Meeting the Mentor', icon: '🪞' },
  { stage: 5, name: 'Crossing the Threshold', icon: '🔥' },
  { stage: 6, name: 'Tests, Allies, Enemies', icon: '🔄' },
  { stage: 7, name: 'Approach to the Inmost Cave', icon: '🔮' },
]

export default function JourneyTimeline({ userId, heroStage, userEmail }) {
  const [evidence, setEvidence] = useState({})

  useEffect(() => {
    if (!userId) return
    let active = true

    // Stage 1: always show (pre-app, no date)
    setEvidence(prev => ({ ...prev, [1]: { date: null, label: 'Life before the crack' } }))

    // All evidence fetches fire in parallel (not serial)
    // Stage 2: first NS check-in
    supabase.from('nervous_system_checkins')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) {
          setEvidence(prev => ({ ...prev, [2]: { date: data.created_at, label: 'First check-in' } }))
        }
      })

    // Stage 3: life paths session (email passed from parent to avoid duplicate auth call)
    if (userEmail) {
      supabase.from('life_path_sessions')
        .select('created_at')
        .eq('client_email', userEmail)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (active && data) setEvidence(prev => ({ ...prev, [3]: { date: data.created_at, label: 'Life Paths mapped' } }))
        })
    }

    // Stage 4: essence mirror
    supabase.from('user_stage_progress')
      .select('essence_mirror_completed, hero_avatar_url, updated_at')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.essence_mirror_completed && data?.hero_avatar_url) {
          setEvidence(prev => ({ ...prev, [4]: { date: data.updated_at, label: 'Hero avatar created' } }))
        }
      })

    // Stage 5: first Vibe Rise wahoo
    supabase.from('quest_completions')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('quest_category', 'Groans')
      .like('reflection_text', '%"wahoo_classification":"vibe"%')
      .order('completed_at', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setEvidence(prev => ({ ...prev, [5]: { date: data.completed_at, label: 'First Vibe Rise moment' } }))
      })

    // Stage 6: life path at vibe + charging/teaching
    supabase.from('quests')
      .select('label, updated_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .eq('predicted_state', 'vibe')
      .in('depth_level', ['charging', 'teaching'])
      .order('updated_at', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setEvidence(prev => ({ ...prev, [6]: { date: data.updated_at, label: `${data.label} reached Vibe Rise` } }))
      })

    return () => { active = false }
  }, [userId, heroStage, userEmail])

  // Always show at least stage 1 (Ordinary World) as completed — signing up = the crack happened
  const effectiveStage = Math.max(heroStage, 2)
  const completedStages = HERO_STAGES.filter(s => s.stage < effectiveStage)

  return (
    <div className="jtl-timeline">
      {completedStages.map(s => {
        const ev = evidence[s.stage]
        return (
          <div key={s.stage} className="jtl-item">
            <div className="jtl-dot">✓</div>
            <div className="jtl-content">
              <div className="jtl-name">{s.icon} {s.name}</div>
              {ev && (
                <div className="jtl-detail">
                  {ev.label}
                  {ev.date && ` · ${new Date(ev.date).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}`}
                </div>
              )}
            </div>
          </div>
        )
      })}
      <div className="jtl-item jtl-current">
        <div className="jtl-dot jtl-dot-current" />
        <div className="jtl-content">
          <div className="jtl-name">You are here</div>
        </div>
      </div>
    </div>
  )
}
