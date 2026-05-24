/**
 * DnaInsightCard — contextual DNA-based guidance for experience lifecycle.
 *
 * Shows one insight at a time based on where the experience is in its lifecycle:
 *   - DESIGN: checklist < 50% and before event date
 *   - FILL: checklist > 50% and before event date
 *   - RUN: event date is today
 *   - REFLECT: after event date
 *
 * CSS prefix: dna-
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { hapticLight } from '../lib/haptics'
import './DnaInsightCard.css'

// DNA-based insight templates per lifecycle phase
const INSIGHTS = {
  DESIGN: {
    craft: {
      title: 'Design with depth',
      body: "Your strength is creating transformational containers. Don't rush the design. But set a launch date NOW, before perfection takes over.",
      action: null,
    },
    empire: {
      title: 'Design for scale',
      body: "You think big. Design the first version fast, then iterate. Don't over-engineer, just get the structure right and launch.",
      action: null,
    },
  },
  FILL: {
    craft: {
      title: 'Your blind spot is visibility',
      body: "You build incredible experiences but under-promote them. Your growth lever isn't a better product, it's more people knowing about it.",
      action: { label: 'Post about it →', type: 'wahoo' },
    },
    empire: {
      title: 'Fill with momentum',
      body: "You have the energy for outreach. Use it. DM 10 people who need this, post daily, and create urgency. Your strength is momentum.",
      action: { label: 'Start outreach →', type: 'wahoo' },
    },
  },
  RUN: {
    craft: {
      title: "Hold space, don't rush",
      body: "As a depth-first creator, your superpower is presence. Hold silence longer than feels comfortable. Trust the container you built.",
      action: null,
    },
    empire: {
      title: 'Bring the energy',
      body: "You light up rooms. Lead with energy, read the crowd, and adapt in real-time. Don't over-plan the transitions, feel them.",
      action: null,
    },
  },
  REFLECT: {
    craft: {
      title: 'Start with what worked',
      body: "You'll naturally focus on what wasn't perfect. Resist that. Start with: what moment had the most impact? Build on that.",
      action: { label: 'Capture 3% →', type: 'reflect' },
    },
    empire: {
      title: 'Capture before you move on',
      body: "You'll want to jump to the next event. Slow down. The reflection is where compound growth happens. What's the one thing to change?",
      action: { label: 'Capture 3% →', type: 'reflect' },
    },
  },
}

// Stuck point–specific nudges that override the default FILL insight
const STUCK_POINT_NUDGES = {
  Campaign: "Your stuck point is Campaign. You know what to offer but struggle getting people to show up. One visibility action today changes everything.",
  Offer: "Your stuck point is Offer. Nail the one-line promise before promoting. What transformation do people walk away with?",
  Pricing: "Your stuck point is Pricing. You're likely underpricing. What would you charge if you knew they'd say yes?",
  Product: "Your stuck point is Product. Stop tweaking the product and start filling the room. The product improves through delivery, not design.",
}

function getPhase(experience, checklistProgress) {
  if (!experience) return null
  const eventDate = experience.experience_date
  if (!eventDate) return 'DESIGN'

  const today = new Date().toISOString().slice(0, 10)
  const isAfter = today > eventDate
  const isToday = today === eventDate

  if (isAfter || experience.status === 'completed' || experience.status === 'archived') return 'REFLECT'
  if (isToday) return 'RUN'
  if (checklistProgress > 50) return 'FILL'
  return 'DESIGN'
}

function getCreatorType(sliderValues) {
  const scale = sliderValues?.scaleApproach || 3
  return scale <= 3 ? 'craft' : 'empire'
}

export default function DnaInsightCard({ userId, experience, checklistProgress = 0 }) {
  const navigate = useNavigate()
  const [dna, setDna] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('founder_dna_results')
      .select('slider_values, archetype, stuck_point_name, matched_founder')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => { if (data) setDna(data) })
  }, [userId])

  if (!dna || !experience || dismissed) return null

  const phase = getPhase(experience, checklistProgress)
  if (!phase) return null

  const creatorType = getCreatorType(dna.slider_values)
  const insight = INSIGHTS[phase]?.[creatorType]
  if (!insight) return null

  // Override body with stuck point nudge during FILL phase
  const body = (phase === 'FILL' && dna.stuck_point_name && STUCK_POINT_NUDGES[dna.stuck_point_name])
    ? STUCK_POINT_NUDGES[dna.stuck_point_name]
    : insight.body

  const phaseEmoji = { DESIGN: '🎨', FILL: '📣', RUN: '⚡', REFLECT: '🔍' }[phase]
  const phaseLabel = { DESIGN: 'Design', FILL: 'Fill', RUN: 'Run', REFLECT: 'Reflect' }[phase]

  return (
    <div className="dna-card">
      <div className="dna-header">
        <span className="dna-phase">{phaseEmoji} {phaseLabel} Phase</span>
        <button className="dna-dismiss" onClick={() => setDismissed(true)}>×</button>
      </div>
      <div className="dna-title">{insight.title}</div>
      <p className="dna-body">{body}</p>
      {insight.action && (
        <button
          className="dna-action"
          onClick={() => {
            hapticLight()
            if (insight.action.type === 'wahoo') {
              navigate('/7-day-challenge?tab=wahoo')
            } else if (insight.action.type === 'reflect') {
              // Scroll to 3% section or navigate
              const el = document.querySelector('.exp-three-percent')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }
          }}
        >
          {insight.action.label}
        </button>
      )}
      {dna.archetype && (
        <div className="dna-meta">
          {dna.archetype}{dna.matched_founder ? ` · matched with ${dna.matched_founder}` : ''}
        </div>
      )}
    </div>
  )
}
