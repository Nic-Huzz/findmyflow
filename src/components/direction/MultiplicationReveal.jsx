/**
 * MultiplicationReveal.jsx — Card 3: Your Direction (Skill × Problem)
 *
 * Progressive 4-beat reveal:
 * 1. "You're a natural [skill]"
 * 2. "for people who [problem tagline]"
 * 3. "That points toward: [turnsInto filtered by skill]"
 * 4. "What keeps you fuelled: [dome branches]"
 */

import { useState, useEffect } from 'react'
import { getTopSkills, getDomeFuel } from '../../lib/directionEngine'
import { supabase } from '../../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import problemTaxonomy from '../../../public/data/problemTaxonomyV2.json'
import './MultiplicationReveal.css'

const CATEGORY_META = {}
problemTaxonomy.categories.forEach(c => {
  CATEGORY_META[c.id] = { displayName: c.displayName, tagline: c.tagline, turnsInto: c.turnsInto }
})

// Map skill IDs to verbs for the reveal copy
const SKILL_VERBS = {
  storytelling: 'tell stories',
  teaching: 'teach',
  coaching: 'coach',
  performing: 'perform',
  creating: 'create',
  building: 'build',
  designing: 'design',
  leading: 'lead',
  connecting: 'connect people',
  speaking_up: 'speak up',
}

export default function MultiplicationReveal({ userId, problemSelections = [], onComplete, onClose }) {
  const [beat, setBeat] = useState(0) // 0 = loading, 1-4 = reveal beats, 5 = final
  const [skills, setSkills] = useState([])
  const [problems, setProblems] = useState([])
  const [fuel, setFuel] = useState([])
  const [turnsInto, setTurnsInto] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    Promise.all([
      getTopSkills(userId, 2),
      getDomeFuel(userId, 3),
    ]).then(([skillData, fuelData]) => {
      setSkills(skillData)
      setFuel(fuelData)

      // Use problem selections passed from DirectionSection (avoids re-fetch race)
      const problemData = problemSelections
        .map(id => CATEGORY_META[id])
        .filter(Boolean)
      setProblems(problemData)

      // Build turnsInto: combine problem's turnsInto with skill context
      if (problemData.length > 0 && skillData.length > 0) {
        const allTurnsInto = problemData.map(p => p.turnsInto).join(', ')
        // Parse comma-separated string, filter for relevance to skill
        const options = allTurnsInto.split(',').map(s => s.trim()).filter(Boolean)
        // Take first 3-4 unique options
        const unique = [...new Set(options)].slice(0, 4)
        setTurnsInto(unique.join(', '))
      }

      setBeat(1)
    })
  }, [userId, problemSelections])

  const advance = () => {
    hapticLight()
    if (beat < 5) setBeat(beat + 1)
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    hapticSuccess()

    await supabase.from('direction_reveals').upsert({
      user_id: userId,
      reveal_type: 'multiplication',
      reveal_data: {
        skills: skills.map(s => ({ id: s.id, displayName: s.displayName })),
        problems: problems.map(p => ({ displayName: p.displayName, tagline: p.tagline })),
        turnsInto,
        fuel: fuel.map(f => f.branch),
      },
    }, { onConflict: 'user_id,reveal_type' })

    onComplete?.()
  }

  if (beat === 0) {
    return (
      <div className="mr-container">
        <div className="mr-loading">Building your direction...</div>
      </div>
    )
  }

  const topSkill = skills[0]
  const topProblem = problems[0]

  // Edge case: not enough data
  if (!topSkill || !topProblem) {
    return (
      <div className="mr-container">
        <button className="mr-close" onClick={onClose}>&times;</button>
        <div className="mr-empty">
          <h2>Not enough data yet</h2>
          <p>Complete more courage challenges to build your skill profile, and finish the problem motivation card first.</p>
        </div>
      </div>
    )
  }

  const skillVerb = SKILL_VERBS[topSkill.id] || topSkill.displayName.toLowerCase()
  const problemTagline = topProblem.tagline.charAt(0).toLowerCase() + topProblem.tagline.slice(1)

  return (
    <div className="mr-container" onClick={beat < 5 ? advance : undefined}>
      <button className="mr-close" onClick={(e) => { e.stopPropagation(); onClose() }}>&times;</button>

      <div className="mr-reveal">
        {/* Beat 1: Skill */}
        <div className={`mr-beat ${beat >= 1 ? 'visible' : ''}`}>
          <p className="mr-beat-text">You're a natural at</p>
          <h2 className="mr-beat-highlight">{topSkill.displayName}</h2>
          {skills.length > 1 && (
            <p className="mr-beat-sub">and {skills.slice(1).map(s => s.displayName.toLowerCase()).join(' and ')}</p>
          )}
        </div>

        {/* Beat 2: Problem */}
        <div className={`mr-beat ${beat >= 2 ? 'visible' : ''}`}>
          <p className="mr-beat-text">for people dealing with</p>
          <h2 className="mr-beat-highlight mr-beat-problem">{topProblem.displayName}</h2>
          <p className="mr-beat-tagline">{problemTagline}</p>
        </div>

        {/* Beat 3: Direction */}
        <div className={`mr-beat ${beat >= 3 ? 'visible' : ''}`}>
          <p className="mr-beat-text">That points toward</p>
          <p className="mr-beat-direction">{turnsInto}</p>
        </div>

        {/* Beat 4: Fuel */}
        <div className={`mr-beat ${beat >= 4 ? 'visible' : ''}`}>
          <p className="mr-beat-text">What keeps you fuelled</p>
          <div className="mr-fuel-pills">
            {fuel.map(f => (
              <span key={f.branch} className="mr-fuel-pill">{f.branch}</span>
            ))}
          </div>
        </div>

        {/* Beat 5: Save */}
        {beat >= 5 && (
          <div className="mr-save-section">
            <button className="mr-save-btn" onClick={(e) => { e.stopPropagation(); handleSave() }} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}

        {/* Tap prompt */}
        {beat < 5 && (
          <p className="mr-tap-hint">Tap to continue</p>
        )}
      </div>
    </div>
  )
}
