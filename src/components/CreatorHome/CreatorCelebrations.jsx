/**
 * CreatorCelebrations — milestone celebration system for Scale portal.
 *
 * Checks milestones on mount/update. Fires confetti + toast via queue
 * (3-second cooldown). Each milestone fires once per device (localStorage).
 *
 * Mount this inside CreatorHomeV2. Pass all completion data as props.
 */
import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { hapticSuccess } from '../../lib/haptics'
import { isCelebrated, markCelebrated, queueCelebration } from '../../lib/creatorGamification'
import './CreatorCelebrations.css'

const MILESTONES = [
  { key: 'results', check: d => d.hasRemarkableResults, toast: "Your rule break is locked in. Most creators never get this far." },
  { key: 'reach', check: d => d.hasReach, toast: "You know how your story spreads. That's rare." },
  { key: 'growth', check: d => d.hasGrowth, toast: "Barriers mapped. On-ramp designed. One more to go." },
  { key: 'scale_score', check: d => d.hasScaleScore, toast: "Scale Score complete. You now know exactly where you stand." },
  { key: 'positioning', check: d => d.hasPositioning, toast: "You have words for what you do now. That changes everything." },
  { key: 'first_experience', check: d => d.experienceCount > 0, toast: "Your first experience exists. It's real now." },
  { key: 'first_pipeline', check: d => d.pastEventCount > 0, toast: "First event through the pipeline. The system is working." },
  { key: 'sold_out', check: d => d.hasSoldOut, toast: "Sold out. Let that sink in." },
  { key: 'attendees_10', check: d => d.totalAttendees >= 10, toast: "10 people showed up because of you." },
  { key: 'attendees_50', check: d => d.totalAttendees >= 50, toast: "50 attendees. You're building something real." },
  { key: 'attendees_100', check: d => d.totalAttendees >= 100, toast: "100 people. That's not a hobby. That's a movement." },
  { key: 'first_repeat', check: d => d.repeatRate > 0, toast: "Someone came back. That's the strongest signal there is." },
  { key: 'first_3pct', check: d => d.threePercentCount > 0, toast: "First 3% logged. Small improvements compound into mastery." },
  { key: 'instagram', check: d => d.instagramConnected, toast: "Connected. Now we can see what's working." },
]

function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#E9A23B', '#f5c55a', '#5e17eb', '#8b5cf6'],
  })
}

export default function CreatorCelebrations({ data = {} }) {
  const [activeToast, setActiveToast] = useState(null)
  const checkedRef = useRef(false)

  useEffect(() => {
    // Only check once per mount (not on every re-render)
    if (checkedRef.current) return
    checkedRef.current = true

    // Small delay to let the portal render first
    const timer = setTimeout(() => {
      MILESTONES.forEach(m => {
        if (m.check(data) && !isCelebrated(m.key)) {
          queueCelebration(() => {
            markCelebrated(m.key)
            fireConfetti()
            hapticSuccess()
            setActiveToast(m.toast)
            setTimeout(() => setActiveToast(null), 4000)
          })
        }
      })
    }, 1500)

    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeToast) return null

  return (
    <div className="cc-toast" onClick={() => setActiveToast(null)}>
      <div className="cc-toast-inner">
        <span className="cc-toast-icon">🎉</span>
        <span className="cc-toast-text">{activeToast}</span>
      </div>
    </div>
  )
}
