import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import UnstickFlow from './UnstickFlow'
import './JourneyTab.css'

// Hero stage names + feeling targets (from measurement framework)
const HERO_STAGES = [
  { stage: 0, name: 'Not Started', feeling: '' },
  { stage: 1, name: 'The Matrix', feeling: 'Something just shifted. I can\'t go back.' },
  { stage: 2, name: 'The Earthquake', feeling: 'Something just shifted. I can\'t go back.' },
  { stage: 3, name: 'Head Full of Dreams', feeling: 'I can see it but I can\'t reach it.' },
  { stage: 4, name: 'Mirror / Mentor', feeling: 'I feel so seen. I have words for this now.' },
  { stage: 5, name: 'First Vibe Rise', feeling: 'I didn\'t know I could feel this alive.' },
  { stage: 6, name: 'The Daily Loop', feeling: 'I\'m actually doing it. Every day.' },
  { stage: 7, name: 'Pattern Revealed', feeling: 'That\'s what\'s been stopping me.' },
  { stage: 8, name: 'The Ordeal', feeling: 'That hurt. But something released.' },
  { stage: 9, name: 'Flow Statement', feeling: 'Of course. This was always my path.' },
  { stage: 10, name: 'Aligned Action', feeling: 'I\'m doing the thing. For real.' },
]

export default function JourneyTab({ userId }) {
  const [heroStage, setHeroStage] = useState(0)
  const [voiceCounts, setVoiceCounts] = useState({})
  const [brief, setBrief] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showUnstickFlow, setShowUnstickFlow] = useState(false)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      supabase.from('user_stage_progress')
        .select('current_journey_level')
        .eq('user_id', userId).maybeSingle(),
      supabase.from('healing_intentions')
        .select('protective_voice')
        .eq('user_id', userId)
        .not('protective_voice', 'is', null),
      supabase.from('zarlo_briefs')
        .select('brief')
        .eq('user_id', userId).maybeSingle(),
    ]).then(([stageRes, voiceRes, briefRes]) => {
      setHeroStage(stageRes.data?.current_journey_level || 0)

      const counts = {}
      voiceRes.data?.forEach(row => {
        if (row.protective_voice)
          counts[row.protective_voice] = (counts[row.protective_voice] || 0) + 1
      })
      setVoiceCounts(counts)
      setBrief(briefRes.data?.brief || null)
      setLoading(false)
    })
  }, [userId])

  if (loading) return <div className="jt-loading">Loading journey...</div>

  const stageInfo = HERO_STAGES[heroStage] || HERO_STAGES[0]
  const sorted = Object.entries(voiceCounts).sort((a, b) => b[1] - a[1])
  const dominant = sorted[0] // [name, count] or undefined

  return (
    <div className="jt-container">
      {/* Current Stage */}
      <div className="jt-stage-card">
        <div className="jt-stage-number">Stage {heroStage}</div>
        <h2 className="jt-stage-name">{stageInfo.name}</h2>
        {stageInfo.feeling && (
          <p className="jt-stage-feeling">"{stageInfo.feeling}"</p>
        )}
      </div>

      {/* Voice Progress (Stage 5-6 only, leading to Stage 7) */}
      {heroStage >= 5 && heroStage < 7 && dominant && (
        <div className="jt-section">
          <h3 className="jt-section-title">Pattern Recognition</h3>
          <div className="jt-voice-dots">
            {[1, 2, 3, 4, 5].map(i => (
              <span key={i} className={`jt-dot ${i <= dominant[1] ? 'jt-dot-filled' : ''}`} />
            ))}
          </div>
          <p className="jt-voice-hint">
            {dominant[1] < 3 && `${dominant[1]} of 5 patterns identified`}
            {dominant[1] === 3 && `The ${formatVoice(dominant[0])} keeps showing up.`}
            {dominant[1] === 4 && `Four times. There's something underneath it.`}
            {dominant[1] >= 5 && `The ${formatVoice(dominant[0])}. Five times. You're ready.`}
          </p>
        </div>
      )}

      {/* Stuck Detection (from Zarlo Brief) */}
      {brief?.thresholds?.stage_stuck_days > 0 && (
        <div className="jt-section jt-stuck-section">
          <span className="jt-stuck-icon">🧭</span>
          <p className="jt-stuck-message">
            {getStuckMessage(heroStage, brief.thresholds.stage_stuck_days)}
          </p>
          {brief.thresholds.stage_stuck_days > 7 && (
            <button className="jt-stuck-cta" onClick={() => setShowUnstickFlow(true)}>
              Let's work through it
            </button>
          )}
        </div>
      )}

      {/* Approaching Thresholds (from Zarlo Brief) */}
      {brief?.thresholds?.streak_milestone_approaching && (
        <div className="jt-section">
          <p className="jt-threshold-hint">
            Streak milestone approaching: {brief.thresholds.streak_milestone_approaching.replace('_', '-')}
          </p>
        </div>
      )}

      {showUnstickFlow && (
        <UnstickFlow
          userId={userId}
          heroStage={heroStage}
          onClose={() => setShowUnstickFlow(false)}
          onWahooCreated={() => {
            setShowUnstickFlow(false)
            // Refresh data so voice dots / stage update
            window.location.reload() // Simple V1. Replace with state refresh in V2.
          }}
        />
      )}
    </div>
  )
}

function getStuckMessage(stage, days) {
  if (days <= 7) return "You've been here a while. That's not wrong. The journey has its own pace."
  if (stage <= 3) return "There's a step you haven't taken yet. It's simpler than you think."
  if (stage === 4) return "You've done wahoos but none have hit Vibe Rise yet. Let's figure out what lights you up."
  if (stage === 5) return "You hit Vibe Rise once. What stopped you from going back?"
  if (stage === 6) return "Your courage is growing but the pattern underneath hasn't surfaced. Let's dig."
  if (stage === 7) return "You've seen the root. The next step isn't in the app. What's holding you back from booking?"
  return "There's something you haven't tried yet."
}

function formatVoice(name) {
  return name?.charAt(0).toUpperCase() + name?.slice(1).replace(/_/g, ' ')
}
