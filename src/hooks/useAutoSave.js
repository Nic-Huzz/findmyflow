/**
 * useAutoSave - Reusable hook for auto-saving flow progress to localStorage
 *
 * Usage:
 *   const { saveProgress, loadProgress, clearProgress, hasProgress } = useAutoSave('offer-builder', user?.id)
 *
 *   // Save on state changes
 *   useEffect(() => {
 *     saveProgress({ stage, answers, sectionInputs })
 *   }, [stage, answers, sectionInputs])
 *
 *   // Load on mount
 *   useEffect(() => {
 *     const saved = loadProgress()
 *     if (saved) {
 *       setStage(saved.stage)
 *       setAnswers(saved.answers)
 *     }
 *   }, [])
 *
 *   // Clear on completion
 *   clearProgress()
 */

import { useCallback, useMemo } from 'react'

const STORAGE_PREFIX = 'fmf_flow_progress_'
const EXPIRY_HOURS = 72 // Progress expires after 72 hours

export function useAutoSave(flowId, userId) {
  const storageKey = useMemo(() => {
    if (!userId) return null
    return `${STORAGE_PREFIX}${flowId}_${userId}`
  }, [flowId, userId])

  // Save progress to localStorage
  const saveProgress = useCallback((data) => {
    if (!storageKey || !data) return false

    try {
      const payload = {
        ...data,
        savedAt: Date.now(),
        flowId,
        userId
      }
      localStorage.setItem(storageKey, JSON.stringify(payload))
      return true
    } catch (err) {
      console.warn('Auto-save failed:', err)
      return false
    }
  }, [storageKey, flowId, userId])

  // Load progress from localStorage
  const loadProgress = useCallback(() => {
    if (!storageKey) return null

    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return null

      const data = JSON.parse(saved)

      // Check if expired
      const hoursSinceSave = (Date.now() - data.savedAt) / (1000 * 60 * 60)
      if (hoursSinceSave > EXPIRY_HOURS) {
        localStorage.removeItem(storageKey)
        return null
      }

      return data
    } catch (err) {
      console.warn('Auto-save load failed:', err)
      return null
    }
  }, [storageKey])

  // Clear saved progress
  const clearProgress = useCallback(() => {
    if (!storageKey) return
    try {
      localStorage.removeItem(storageKey)
    } catch (err) {
      console.warn('Auto-save clear failed:', err)
    }
  }, [storageKey])

  // Check if there's saved progress
  const hasProgress = useCallback(() => {
    const saved = loadProgress()
    return saved !== null
  }, [loadProgress])

  // Get time since last save (for display)
  const getLastSaveTime = useCallback(() => {
    const saved = loadProgress()
    if (!saved?.savedAt) return null
    return new Date(saved.savedAt)
  }, [loadProgress])

  return {
    saveProgress,
    loadProgress,
    clearProgress,
    hasProgress,
    getLastSaveTime,
    isEnabled: !!storageKey
  }
}

export default useAutoSave
