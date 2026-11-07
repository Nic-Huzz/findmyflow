/**
 * JourneyContainer.jsx
 *
 * Dual-mode orchestrator for the Essence Journey.
 * /journey       → solo onboarding (self-paced)
 * /journey/:code → workshop mode (real-time checkpoint gates)
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { useWorkshopChannel } from '../hooks/useWorkshopChannel'

import ChildhoodReflectionFlow from './ChildhoodReflectionFlow'
import WoundMapFlow from './WoundMapFlow'
import VibeRiseRadar from './VibeRiseRadar'
import AlivenessQuiz from './AlivenessQuiz'
import EssenceMirrorFlow from './EssenceMirrorFlow'
import ExperienceGameFlow from './ExperienceGameFlow'
import ChooseQuestsFlow from './ChooseQuestsFlow'
import ZoneCalRadar from './ZoneCalRadar'

import JoinScreen from '../components/journey/JoinScreen'
import CheckpointScreen from '../components/journey/CheckpointScreen'
import './JourneyContainer.css'

const JOURNEY_STAGES = [
  {
    id: 'essence',
    label: 'Living from Essence',
    subflows: [
      { Component: ChildhoodReflectionFlow, props: {} },
    ],
  },
  {
    id: 'suppressed',
    label: 'Essence Suppressed',
    subflows: [
      { Component: WoundMapFlow, props: {} },
    ],
  },
  {
    id: 'consequences',
    label: 'Consequences',
    subflows: [
      { Component: VibeRiseRadar, props: { skipEmailGate: true } },
      { Component: AlivenessQuiz, props: { skipEmailGate: true } },
    ],
  },
  {
    id: 'search',
    label: 'The Search',
    subflows: [
      { Component: EssenceMirrorFlow, props: {} },
    ],
  },
  {
    id: 'challenge',
    label: 'The Challenge',
    subflows: [
      { Component: ExperienceGameFlow, props: {} },
      { Component: ChooseQuestsFlow, props: {} },
      { Component: ZoneCalRadar, props: { skipEmailGate: true } },
    ],
  },
]

export default function JourneyContainer() {
  const { code } = useParams()
  const { user } = useAuth()
  const isWorkshop = !!code

  // Journey state
  const [stageIndex, setStageIndex] = useState(0)
  const [subflowIndex, setSubflowIndex] = useState(0)
  const [showCheckpoint, setShowCheckpoint] = useState(false)
  const [checkpointUnlocked, setCheckpointUnlocked] = useState(false)

  // Workshop state
  const [joined, setJoined] = useState(false)
  const [participantId, setParticipantId] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [workshopCurrentStage, setWorkshopCurrentStage] = useState(0)

  // Use ref for the advance handler so it has access to latest state
  const stageRef = useRef(stageIndex)
  useEffect(() => { stageRef.current = stageIndex }, [stageIndex])

  const handleAdvance = useCallback((payload) => {
    // Facilitator advanced — unlock checkpoint
    setWorkshopCurrentStage(payload.stage)
    if (payload.stage > stageRef.current) {
      setCheckpointUnlocked(true)
    }
  }, [])

  const { broadcast, presenceCount } = useWorkshopChannel(
    isWorkshop && joined ? code : null,
    {
      participantId,
      onAdvance: handleAdvance,
    }
  )

  // On page refresh in workshop mode, restore state from DB
  useEffect(() => {
    if (!isWorkshop || !joined || !sessionId || !participantId) return

    const restore = async () => {
      // Get workshop current stage
      const { data: session } = await supabase
        .from('workshop_sessions')
        .select('current_stage')
        .eq('id', sessionId)
        .single()

      if (session) {
        setWorkshopCurrentStage(session.current_stage)
      }

      // Get participant progress
      const { data: part } = await supabase
        .from('workshop_participants')
        .select('current_stage, current_subflow, stage_completed')
        .eq('id', participantId)
        .single()

      if (part) {
        // Land on the right stage
        if (part.stage_completed?.[part.current_stage]) {
          // Stage complete, show checkpoint
          setStageIndex(part.current_stage)
          setSubflowIndex(0)
          setShowCheckpoint(true)
          // If facilitator already advanced past this, unlock
          if (session && session.current_stage > part.current_stage) {
            setCheckpointUnlocked(true)
          }
        } else {
          setStageIndex(part.current_stage)
          setSubflowIndex(part.current_subflow || 0)
        }
      }
    }

    restore()
  }, [isWorkshop, joined, sessionId, participantId])

  // Handle flow completion
  const handleFlowComplete = useCallback(async (data) => {
    const stage = JOURNEY_STAGES[stageIndex]
    const isLastSubflow = subflowIndex >= stage.subflows.length - 1

    if (!isLastSubflow) {
      // Advance to next subflow within stage
      const nextSub = subflowIndex + 1
      setSubflowIndex(nextSub)

      // Update participant progress in DB
      if (isWorkshop && participantId) {
        await supabase
          .from('workshop_participants')
          .update({ current_subflow: nextSub })
          .eq('id', participantId)
      }
    } else {
      // Stage complete — show checkpoint
      setShowCheckpoint(true)
      setCheckpointUnlocked(false)

      // Update participant progress in DB
      if (isWorkshop && participantId) {
        // Read existing completions, fall back to defaults on error
        const { data: existing, error: readErr } = await supabase
          .from('workshop_participants')
          .select('stage_completed')
          .eq('id', participantId)
          .single()

        if (readErr) {
          console.warn('Failed to read stage_completed, using defaults:', readErr)
        }

        const merged = [...(existing?.stage_completed || [false, false, false, false, false])]
        merged[stageIndex] = true

        await supabase
          .from('workshop_participants')
          .update({
            current_stage: stageIndex,
            current_subflow: 0,
            stage_completed: merged,
          })
          .eq('id', participantId)

        // Broadcast progress to facilitator
        broadcast('progress', {
          participantId,
          stage: stageIndex,
          status: 'completed',
        })
      }
    }
  }, [stageIndex, subflowIndex, isWorkshop, participantId, broadcast])

  // Checkpoint continue (advance to next stage)
  const handleCheckpointContinue = useCallback(async () => {
    const nextStage = stageIndex + 1
    if (nextStage >= JOURNEY_STAGES.length) {
      // Journey complete — clear checkpoint so the complete screen renders
      setShowCheckpoint(false)
      if (isWorkshop && participantId) {
        await supabase
          .from('workshop_participants')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', participantId)
      }
      return
    }

    setStageIndex(nextStage)
    setSubflowIndex(0)
    setShowCheckpoint(false)
    setCheckpointUnlocked(false)

    // Update participant in DB
    if (isWorkshop && participantId) {
      await supabase
        .from('workshop_participants')
        .update({ current_stage: nextStage, current_subflow: 0 })
        .eq('id', participantId)
    }

    window.scrollTo(0, 0)
  }, [stageIndex, isWorkshop, participantId])

  // Workshop join handler
  const handleJoined = useCallback(({ participantId: pid, sessionId: sid }) => {
    setParticipantId(pid)
    setSessionId(sid)
    setJoined(true)
  }, [])

  // --- RENDER ---

  // Workshop mode: show join screen if not joined
  if (isWorkshop && !joined) {
    return <JoinScreen code={code} onJoined={handleJoined} />
  }

  // Checkpoint screen
  if (showCheckpoint) {
    return (
      <CheckpointScreen
        isWorkshop={isWorkshop}
        completedStage={stageIndex}
        onContinue={handleCheckpointContinue}
        unlocked={checkpointUnlocked}
      />
    )
  }

  // Active flow
  const currentStage = JOURNEY_STAGES[stageIndex]
  const currentSubflow = currentStage?.subflows[subflowIndex]

  if (!currentStage || !currentSubflow) {
    // Journey complete
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#09090F', color: '#fff', textAlign: 'center', padding: 24 }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: 12 }}>Journey Complete</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 400 }}>
          Your challenge is set. The breakthrough happens when you go do it. Not in this room. In real life.
        </p>
      </div>
    )
  }

  const { Component, props: flowProps } = currentSubflow

  return (
    <div className="jc-wrapper">
      <div className="jc-stage-label">
        Stage {stageIndex + 1}: {currentStage.label}
      </div>
      <Component {...flowProps} onComplete={handleFlowComplete} />
    </div>
  )
}
