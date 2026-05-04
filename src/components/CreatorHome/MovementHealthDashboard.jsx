/**
 * MovementHealthDashboard — replaces Coming Soon Trajectory Projections card.
 * Shows aggregate trends across completed experiences.
 * Gate: requires 2+ completed experiences.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './MovementHealthDashboard.css'

export default function MovementHealthDashboard({ userId, completedExperiences, dashboardKPIs }) {
  const [perExpData, setPerExpData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !completedExperiences?.length) { setLoading(false); return }
    ;(async () => {
      try {
        // Fetch all attendees for user, group by experience client-side
        const { data: allAttendees } = await supabase
          .from('experience_attendees')
          .select('experience_id')
          .eq('user_id', userId)

        const countsByExp = {}
        ;(allAttendees || []).forEach(a => {
          countsByExp[a.experience_id] = (countsByExp[a.experience_id] || 0) + 1
        })

        const expData = completedExperiences.map(exp => ({
          id: exp.id,
          name: exp.name,
          date: exp.experience_date,
          attendees: countsByExp[exp.id] || 0,
          has3pct: !!exp.three_percent_note,
        })).sort((a, b) => {
          if (!a.date && !b.date) return 0
          if (!a.date) return 1
          if (!b.date) return -1
          return a.date.localeCompare(b.date)
        })

        setPerExpData(expData)
      } catch (err) {
        console.error('MovementHealthDashboard error:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [userId, completedExperiences])

  if (loading) return null
  if (perExpData.length < 2) {
    return (
      <div className="mhd-card mhd-gate">
        <div className="mhd-title">Trajectory</div>
        <p className="mhd-gate-text">Complete your second experience to unlock trajectory insights.</p>
      </div>
    )
  }

  // Compute verdict
  const latest = perExpData[perExpData.length - 1]
  const prev = perExpData[perExpData.length - 2]
  const attendeeDelta = prev.attendees > 0
    ? Math.round(((latest.attendees - prev.attendees) / prev.attendees) * 100)
    : null // Can't compute % from 0

  const threePercentRate = Math.round((perExpData.filter(e => e.has3pct).length / perExpData.length) * 100)

  let verdict = 'steady'
  let verdictLabel = 'Holding steady'
  if ((attendeeDelta != null && attendeeDelta > 10) || (dashboardKPIs?.repeatRate || 0) > 20) {
    verdict = 'up'
    verdictLabel = 'Trending up'
  } else if (attendeeDelta != null && attendeeDelta < -10) {
    verdict = 'attention'
    verdictLabel = 'Needs attention'
  }

  const maxAttendees = Math.max(...perExpData.map(e => e.attendees), 1)

  return (
    <div className="mhd-card">
      <div className="mhd-header">
        <div className="mhd-title">Trajectory</div>
        <span className={`mhd-verdict mhd-verdict-${verdict}`}>{verdictLabel}</span>
      </div>

      {/* Attendee bars */}
      <div className="mhd-bars">
        {perExpData.map((exp, i) => (
          <div key={exp.id} className="mhd-bar-row">
            <span className="mhd-bar-label">{exp.name.length > 15 ? exp.name.slice(0, 15) + '...' : exp.name}</span>
            <div className="mhd-bar-track">
              <div
                className="mhd-bar-fill"
                style={{ width: `${Math.max((exp.attendees / maxAttendees) * 100, 4)}%` }}
              />
            </div>
            <span className="mhd-bar-val">{exp.attendees}</span>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="mhd-stats">
        <div className="mhd-stat">
          <span className={`mhd-stat-val ${attendeeDelta != null && attendeeDelta > 0 ? 'mhd-green' : attendeeDelta != null && attendeeDelta < 0 ? 'mhd-red' : ''}`}>
            {attendeeDelta != null ? `${attendeeDelta > 0 ? '+' : ''}${attendeeDelta}%` : '--'}
          </span>
          <span className="mhd-stat-label">attendee growth</span>
        </div>
        <div className="mhd-stat">
          <span className="mhd-stat-val">{dashboardKPIs?.repeatRate || 0}%</span>
          <span className="mhd-stat-label">repeat rate</span>
        </div>
        <div className="mhd-stat">
          <span className="mhd-stat-val">{threePercentRate}%</span>
          <span className="mhd-stat-label">3% captured</span>
        </div>
      </div>
    </div>
  )
}
