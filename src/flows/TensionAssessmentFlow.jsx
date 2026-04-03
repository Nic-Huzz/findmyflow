/**
 * TensionAssessmentFlow.jsx
 *
 * Standalone route wrapper for the tension assessment.
 * Used as a Level 0 quest: "Where Am I Stuck?"
 * Saves tension scores then navigates back.
 *
 * Route: /tension-assessment
 * Created: 2026-04-03
 */

import { useNavigate, useSearchParams } from 'react-router-dom'
import TensionGate from '../components/TensionGate'

export default function TensionAssessmentFlow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/7-day-challenge'

  return <TensionGate onComplete={() => navigate(returnTo)} />
}
