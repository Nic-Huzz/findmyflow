import { useState, useEffect } from 'react'
import './InsightDrop.css'

export default function InsightDrop({ insight, onDismiss, onExplore }) {
  const [visible, setVisible] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setDismissing(true)
    setTimeout(() => onDismiss?.(), 300)
  }

  if (!insight) return null

  const isUncommon = insight.rarity === 'uncommon'

  return (
    <div className={`id-container ${visible && !dismissing ? 'id-visible' : ''} ${dismissing ? 'id-dismissing' : ''}`}>
      <div className={`id-card ${isUncommon ? 'id-uncommon' : 'id-common'}`}>
        <div className="id-header">
          <span className="id-icon">{insight.icon}</span>
          <span className={`id-rarity ${isUncommon ? 'id-rarity-uncommon' : 'id-rarity-common'}`}>
            {isUncommon ? 'Insight Unlocked' : 'Pattern Spotted'}
          </span>
          <button className="id-dismiss" onClick={handleDismiss} aria-label="Dismiss">
            &times;
          </button>
        </div>
        <div className="id-title">{insight.title}</div>
        <div className="id-body">{insight.body}</div>
        {onExplore && (
          <button className="id-explore" onClick={() => onExplore(insight)}>
            Ask Zarlo about this
          </button>
        )}
      </div>
    </div>
  )
}
