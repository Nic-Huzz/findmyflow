/**
 * CRMLayout - Wrapper for all CRM pages
 * Includes CoachNudge (bottom-left) for context-aware micro-coaching
 * Includes OnboardingTour for first-time users
 * Includes PageTransition for smooth route changes
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { useLocation } from 'react-router-dom'
import CoachNudge from '../CoachNudge'
import OnboardingTour, { useCRMOnboarding } from './OnboardingTour'
import PageTransition from './PageTransition'
import { checkForNudges, getNudgeActionHandler } from '../../lib/nudgeEngine'
import './CRMLayout.css'

export default function CRMLayout({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  const [currentNudge, setCurrentNudge] = useState(null)
  const [nudgeLoading, setNudgeLoading] = useState(false)
  const { showTour, completeTour } = useCRMOnboarding()

  // Check for nudges on mount and route change
  useEffect(() => {
    if (user?.id) {
      checkNudges()
    }
  }, [user?.id, location.pathname])

  async function checkNudges() {
    if (nudgeLoading) return
    setNudgeLoading(true)

    try {
      // Check if this is first login today
      const lastVisit = localStorage.getItem('crm_last_visit')
      const today = new Date().toDateString()
      const isFirstLoginToday = lastVisit !== today

      if (isFirstLoginToday) {
        localStorage.setItem('crm_last_visit', today)
      }

      const nudge = await checkForNudges(user.id, isFirstLoginToday)
      if (nudge) {
        setCurrentNudge(nudge)
      }
    } catch (err) {
      console.error('Error checking nudges:', err)
    } finally {
      setNudgeLoading(false)
    }
  }

  function handleNudgeDismiss() {
    setCurrentNudge(null)
  }

  function handleNudgeAction(actionData) {
    // Action is handled by the nudge component (navigation or callback)
    setCurrentNudge(null)

    // Refresh nudges after action in case there's a follow-up
    setTimeout(() => {
      checkNudges()
    }, 2000)
  }

  // Get handler for current nudge action
  const nudgeHandler = currentNudge
    ? getNudgeActionHandler(currentNudge.action_type, currentNudge.action_data)
    : null

  // Only show tour on dashboard (home) page
  const isOnDashboard = location.pathname === '/crm'

  return (
    <div className="crm-layout">
      {/* Page content with transitions */}
      <PageTransition>
        {children}
      </PageTransition>

      {/* Coach Nudge - Bottom Left */}
      {currentNudge && (
        <CoachNudge
          nudge={currentNudge}
          handler={nudgeHandler}
          onDismiss={handleNudgeDismiss}
          onAction={handleNudgeAction}
        />
      )}

      {/* Onboarding Tour - First-time users on dashboard */}
      {showTour && isOnDashboard && (
        <OnboardingTour onComplete={completeTour} />
      )}
    </div>
  )
}
