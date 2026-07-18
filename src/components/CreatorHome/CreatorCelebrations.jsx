/**
 * CreatorCelebrations — milestone + achievement + spider celebration system.
 *
 * Three celebration types:
 * 1. Regular milestones (confetti + toast, 14 defined)
 * 2. Hidden achievements (gold trophy confetti + "Achievement Unlocked" toast, 8 defined)
 * 3. Spider tier upgrades (confetti + axis-specific toast)
 *
 * All use the same celebration queue (3-second cooldown).
 * Mount inside CreatorHomeV2. Pass all completion data as props.
 */
import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { hapticSuccess } from '../../lib/haptics'
import {
  isCelebrated, markCelebrated, queueCelebration,
  HIDDEN_ACHIEVEMENTS, isAchievementUnlocked, markAchievementUnlocked,
  checkSpiderTierUpgrades, storeSpiderTiers, getAxisTier,
} from '../../lib/creatorGamification'
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
  // Streak milestones — wired by G8
  { key: 'streak_4', check: d => d.streakMilestone === 4, toast: "4 weeks straight. You're in a rhythm now." },
  { key: 'streak_8', check: d => d.streakMilestone === 8, toast: "8 weeks. Consistency is your superpower." },
  { key: 'streak_12', check: d => d.streakMilestone === 12, toast: "12 weeks. A full quarter of building. That changes you." },
]

function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#E9A23B', '#f5c55a', '#5e17eb', '#8b5cf6'],
  })
}

function fireAchievementConfetti() {
  // Gold-heavy confetti burst for achievements
  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.5 },
    colors: ['#E9A23B', '#f5c55a', '#d4a017', '#ffd700', '#5e17eb'],
  })
}

export default function CreatorCelebrations({ data = {}, spiderData = {} }) {
  const [activeToast, setActiveToast] = useState(null)
  const [toastType, setToastType] = useState('milestone') // 'milestone' | 'achievement' | 'spider'
  const checkedRef = useRef(false)

  useEffect(() => {
    if (checkedRef.current) return
    checkedRef.current = true

    const timer = setTimeout(() => {
      // 1. Regular milestones
      MILESTONES.forEach(m => {
        if (m.check(data) && !isCelebrated(m.key)) {
          queueCelebration(() => {
            markCelebrated(m.key)
            fireConfetti()
            hapticSuccess()
            setToastType('milestone')
            setActiveToast(m.toast)
            setTimeout(() => setActiveToast(null), 4000)
          })
        }
      })

      // 2. Hidden achievements
      HIDDEN_ACHIEVEMENTS.forEach(a => {
        if (a.check(data) && !isAchievementUnlocked(a.key)) {
          queueCelebration(() => {
            markAchievementUnlocked(a.key)
            fireAchievementConfetti()
            hapticSuccess()
            setToastType('achievement')
            setActiveToast({ name: a.name, icon: a.icon, text: a.toast })
            setTimeout(() => setActiveToast(null), 5000)
          })
        }
      })

      // 3. Spider tier upgrades
      const axisKeys = ['impact', 'consistency', 'retention', 'brand', 'price', 'reach']
      const currentTiers = {}
      let hasAnySpiderData = false
      axisKeys.forEach(key => {
        if (spiderData[key] != null) {
          currentTiers[key] = getAxisTier(key, spiderData[key])
          if (currentTiers[key] > 0) hasAnySpiderData = true
        }
      })

      if (hasAnySpiderData) {
        const upgrades = checkSpiderTierUpgrades(currentTiers)
        upgrades.forEach(u => {
          const celebKey = `spider_${u.axisKey}_t${u.newTier}`
          if (!isCelebrated(celebKey)) {
            queueCelebration(() => {
              markCelebrated(celebKey)
              fireConfetti()
              hapticSuccess()
              setToastType('spider')
              setActiveToast(`${u.axisLabel} upgraded to tier ${u.newTier}. Your shape is growing.`)
              setTimeout(() => setActiveToast(null), 4000)
            })
          }
        })
        storeSpiderTiers(currentTiers)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeToast) return null

  // Achievement toasts have a different layout
  if (toastType === 'achievement' && typeof activeToast === 'object') {
    return (
      <div className="cc-toast cc-toast-achievement" onClick={() => setActiveToast(null)}>
        <div className="cc-toast-inner cc-toast-achievement-inner">
          <div className="cc-achievement-header">
            <span className="cc-achievement-icon">{activeToast.icon}</span>
            <span className="cc-achievement-label">Achievement Unlocked</span>
          </div>
          <div className="cc-achievement-name">{activeToast.name}</div>
          <div className="cc-toast-text">{activeToast.text}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="cc-toast" onClick={() => setActiveToast(null)}>
      <div className="cc-toast-inner">
        <span className="cc-toast-icon">{toastType === 'spider' ? '📊' : '🎉'}</span>
        <span className="cc-toast-text">{activeToast}</span>
      </div>
    </div>
  )
}
