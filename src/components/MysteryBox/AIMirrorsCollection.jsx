import { useState, useEffect } from 'react'
import { fetchMysteryBoxes } from '../../lib/mysteryBoxes'
import './MysteryBox.css'

const CONTENT_LABELS = {
  pattern_mirror: 'Pattern Mirror',
  shadow_reveal: 'Shadow Reveal',
  capacity_equation: 'Capacity Insight',
}

const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#E9A23B',
  legendary: '#5e17eb',
}

/**
 * AIMirrorsCollection — gallery of opened mystery box insights on /me page.
 */
export default function AIMirrorsCollection({ userId }) {
  const [boxes, setBoxes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchMysteryBoxes(userId, false).then(({ data }) => {
      setBoxes((data || []).filter(b => b.opened_at && b.content))
      setLoading(false)
    })
  }, [userId])

  if (loading || boxes.length === 0) return null

  return (
    <div className="aim-section">
      <h2 className="aim-title">AI Mirrors</h2>
      <p className="aim-subtitle">Insights your AI has uncovered about you</p>
      <div className="aim-grid">
        {boxes.map(box => (
          <div key={box.id} className="aim-card">
            <div className="aim-card-header">
              <span
                className="aim-card-tier"
                style={{ color: TIER_COLORS[box.box_tier] || TIER_COLORS.bronze }}
              >
                {CONTENT_LABELS[box.content_type] || 'AI Mirror'}
              </span>
              <span className="aim-card-date">
                {new Date(box.opened_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <p className="aim-card-insight">{box.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
