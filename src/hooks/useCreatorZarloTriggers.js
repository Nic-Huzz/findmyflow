/**
 * useCreatorZarloTriggers — Proactive bubble triggers for Scale portal Zarlo.
 *
 * 7 triggers in priority order. Max 2/day, 2-hour cooldown.
 * Returns the highest-priority active trigger message (or null).
 * Called from CreatorHomeV2 after data loads.
 *
 * Frequency: localStorage-based. Same pattern as consumer zarloEngine.js.
 */
import { useState, useEffect } from 'react'

const COOLDOWN_MS = 2 * 60 * 60 * 1000 // 2 hours
const MAX_PER_DAY = 2
const STORAGE_PREFIX = 'creator_zarlo_'

function checkCooldown() {
  const today = new Date().toISOString().slice(0, 10)
  const countKey = `${STORAGE_PREFIX}count_${today}`
  const lastKey = `${STORAGE_PREFIX}last`

  const count = parseInt(localStorage.getItem(countKey) || '0')
  if (count >= MAX_PER_DAY) return false

  const lastTime = parseInt(localStorage.getItem(lastKey) || '0')
  if (Date.now() - lastTime < COOLDOWN_MS) return false

  return true
}

function recordTriggerShown() {
  const today = new Date().toISOString().slice(0, 10)
  const countKey = `${STORAGE_PREFIX}count_${today}`
  const lastKey = `${STORAGE_PREFIX}last`

  const count = parseInt(localStorage.getItem(countKey) || '0')
  localStorage.setItem(countKey, String(count + 1))
  localStorage.setItem(lastKey, String(Date.now()))
}

function hasSeenTrigger(key) {
  return localStorage.getItem(`${STORAGE_PREFIX}seen_${key}`) === 'true'
}

function markTriggerSeen(key) {
  localStorage.setItem(`${STORAGE_PREFIX}seen_${key}`, 'true')
}

/**
 * @param {object} triggerData — computed in CreatorHomeV2
 * @param {object} triggerData.nearestEvent — { name, daysUntil, attractItemsDone }
 * @param {number} triggerData.pipelineReadiness — 0-100
 * @param {number} triggerData.daysSinceActivity — days since last portal-relevant action
 * @param {number} triggerData.threePercentCount — total 3% notes
 * @param {boolean} triggerData.hasSoldOut
 * @param {boolean} triggerData.hasScaleScore
 * @param {boolean} triggerData.quarterlyPlansEmpty
 * @param {boolean} triggerData.hasRemarkableResults — gate: Zarlo only shows after this
 * @param {string} triggerData.nextLaunchPadItem — first incomplete launch pad label
 */
export function useCreatorZarloTriggers(triggerData) {
  const [message, setMessage] = useState(null)
  const [triggerKey, setTriggerKey] = useState(null)

  useEffect(() => {
    if (!triggerData?.hasRemarkableResults) return
    if (!checkCooldown()) return

    const result = evaluateTriggers(triggerData)
    if (result) {
      setMessage(result.message)
      setTriggerKey(result.key)
      recordTriggerShown()
      markTriggerSeen(result.key)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    setMessage(null)
    setTriggerKey(null)
  }

  return { message, dismiss, triggerKey }
}

function evaluateTriggers(data) {
  // Priority 1: Event approaching with no marketing
  if (data.nearestEvent && data.nearestEvent.daysUntil <= 14 && data.nearestEvent.attractItemsDone === 0) {
    const key = `event_approaching_${data.nearestEvent.name}_${data.nearestEvent.daysUntil <= 7 ? 'urgent' : 'soon'}`
    if (!hasSeenTrigger(key)) {
      const days = data.nearestEvent.daysUntil
      return {
        key,
        message: days <= 3
          ? `${data.nearestEvent.name} is in ${days} days. Nobody knows about it yet.`
          : `Your ${data.nearestEvent.name} is in ${days} days and your audience doesn't know about it. Want help with your first post?`,
      }
    }
  }

  // Priority 2: Pipeline 80%+ ready
  if (data.pipelineReadiness >= 80) {
    const key = 'pipeline_almost_ready'
    if (!hasSeenTrigger(key)) {
      return { key, message: "Almost ready. What's the last thing before your event?" }
    }
  }

  // Priority 3: No activity 7+ days
  if (data.daysSinceActivity >= 7) {
    const weekBucket = Math.floor(data.daysSinceActivity / 7)
    const key = `inactive_week_${weekBucket}`
    if (!hasSeenTrigger(key)) {
      const next = data.nextLaunchPadItem || 'your next playbook step'
      return { key, message: `Been quiet. When you're ready, your next step is ${next}.` }
    }
  }

  // Priority 4: 3% improvement logged (chain growing)
  if (data.threePercentCount >= 2) {
    const key = `three_pct_chain_${data.threePercentCount}`
    if (!hasSeenTrigger(key)) {
      return { key, message: `That's ${data.threePercentCount} improvements in a row. You're compounding.` }
    }
  }

  // Priority 5: First sold-out event
  if (data.hasSoldOut) {
    const key = 'sold_out_reflection'
    if (!hasSeenTrigger(key)) {
      return { key, message: "You filled the room. What did you do differently this time? Write it down before you forget." }
    }
  }

  // Priority 6: Scale Score complete
  if (data.hasScaleScore) {
    const key = 'scale_score_complete'
    if (!hasSeenTrigger(key)) {
      return { key, message: "Scale Score done. The highest-scoring creators all share one thing: they run events consistently. When's your next one?" }
    }
  }

  // Priority 7: Quarterly plans empty (new quarter)
  if (data.quarterlyPlansEmpty) {
    const quarter = `${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`
    const key = `quarterly_empty_${quarter}`
    if (!hasSeenTrigger(key)) {
      return { key, message: "New quarter. What experiences are you running? Even a rough plan makes it 3x more likely to happen." }
    }
  }

  return null
}
