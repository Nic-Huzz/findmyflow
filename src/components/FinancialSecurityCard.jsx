/**
 * FinancialSecurityCard.jsx
 *
 * Renders the Financial Security card on the Paths tab.
 * Shows the user's financial security quest, current stage, and next challenge.
 * Replaces PayTheBillsSection.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { FINANCIAL_STAGES } from '../data/tier1Challenges'
import { BoltIcon, ShieldCheckIcon, CheckCircleIcon, ChevronDownIcon } from '@heroicons/react/24/solid'
import { getWeekStartLocal } from '../lib/dateUtils'
import { resetMoneyMap } from '../lib/moneyMapUtils'
import { advanceStage, createNextChallenge } from '../lib/financialSecurityEngine'
import './FinancialSecurityCard.css'

export default function FinancialSecurityCard({ userId, onUpdate }) {
  const navigate = useNavigate()
  const [quest, setQuest] = useState(null)
  const [activeChallenge, setActiveChallenge] = useState(null)
  const [moneyMapDone, setMoneyMapDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pulseExpanded, setPulseExpanded] = useState(false)
  const [pulseSaving, setPulseSaving] = useState(false)

  const [methodSaving, setMethodSaving] = useState(false)

  useEffect(() => {
    if (!userId) return

    async function load() {
      // Check money_map_completed + find financial security quest in parallel
      const [stageRes, questRes] = await Promise.all([
        supabase.from('user_stage_progress')
          .select('money_map_completed')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase.from('quests')
          .select('*')
          .eq('user_id', userId)
          .in('path_type', ['financial_security', 'both'])
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      setMoneyMapDone(!!stageRes.data?.money_map_completed)

      if (questRes.data) {
        setQuest(questRes.data)

        // Only load the active challenge for non-love-it quests
        if (questRes.data.job_relationship !== 'love_it') {
          // Find its active courage challenge
          const { data: challenge } = await supabase.from('groan_challenges')
            .select('*')
            .eq('quest_id', questRes.data.id)
            .in('status', ['active', 'accepted'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          setActiveChallenge(challenge)
        }
      }

      setLoading(false)
    }

    load()
  }, [userId])

  const handlePickMethod = async (method) => {
    if (methodSaving) return
    setMethodSaving(true)

    // Save acquisition_method + advance stage
    await supabase.from('quests')
      .update({ acquisition_method: method })
      .eq('id', quest.id)

    const newStage = await advanceStage(quest.id, 'acquisition')

    // Create the first_opportunity challenge for this method
    let newChallenge = null
    if (newStage) {
      const updatedQuest = { ...quest, financial_stage: newStage, acquisition_method: method }
      newChallenge = await createNextChallenge(userId, updatedQuest)
    }

    // Update local state directly — don't rely on re-fetch (useEffect depends on userId, not quest data)
    setQuest(prev => ({ ...prev, financial_stage: newStage || prev.financial_stage, acquisition_method: method }))
    if (newChallenge) setActiveChallenge(newChallenge)

    setMethodSaving(false)
    onUpdate?.()
  }

  if (loading) return null

  // Completed state: repeatable stage done
  if (quest?.financial_stage === 'repeatable') {
    return null // hide after completion
  }

  // No financial security path
  if (!quest) {
    // User completed Money Map but chose "already sorted" — hide card
    if (moneyMapDone) return null

    // Haven't done Money Map yet — show CTA
    return (
      <div className="fsc-section">
        <div className="fsc-header">
          <ShieldCheckIcon style={{ width: 18, height: 18 }} />
          <span className="fsc-header-title">Financial Security</span>
        </div>
        <div className="fsc-empty">
          <p className="fsc-empty-text">Keep the lights on while you build your dream.</p>
          <button className="fsc-empty-btn" onClick={() => navigate('/money-map')}>
            Set up your financial engine →
          </button>
        </div>
      </div>
    )
  }

  // Love-it state: job they love covering their bills — show permanent card + weekly pulse
  if (quest.job_relationship === 'love_it') {
    const currentWeek = getWeekStartLocal()
    const needsPulse = !quest.bills_pulse_week || quest.bills_pulse_week < currentWeek

    const handlePulseYes = async () => {
      setPulseSaving(true)
      await supabase.from('quests')
        .update({ bills_pulse_week: currentWeek })
        .eq('id', quest.id)
      setQuest(prev => ({ ...prev, bills_pulse_week: currentWeek }))
      setPulseExpanded(false)
      setPulseSaving(false)
    }

    const handlePulseNo = async () => {
      setPulseSaving(true)
      await resetMoneyMap(userId)
      setPulseSaving(false)
      navigate('/money-map?skip=love_it')
    }

    return (
      <div className="fsc-section">
        <div className="fsc-header">
          <BoltIcon style={{ width: 18, height: 18, color: 'var(--accent-gold)' }} />
          <span className="fsc-header-title">Financial Security</span>
        </div>
        <div className="fsc-card fsc-card-love">
          <div className="fsc-card-name">{quest.label}</div>
          <div className="fsc-love-status">Covering your bills</div>
          {needsPulse && (
            <button
              className={`fsc-pulse-toggle ${pulseExpanded ? 'expanded' : ''}`}
              onClick={() => setPulseExpanded(!pulseExpanded)}
            >
              <span>Still covering your bills?</span>
              <ChevronDownIcon style={{ width: 16, height: 16, transition: 'transform 0.2s', transform: pulseExpanded ? 'rotate(180deg)' : 'none' }} />
            </button>
          )}
          {pulseExpanded && (
            <div className="fsc-pulse-actions">
              <button className="fsc-pulse-btn fsc-pulse-yes" onClick={handlePulseYes} disabled={pulseSaving}>
                Yes, still good
              </button>
              <button className="fsc-pulse-btn fsc-pulse-no" onClick={handlePulseNo} disabled={pulseSaving}>
                No, things changed
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Active state: show current stage + challenge
  const currentStageIdx = FINANCIAL_STAGES.findIndex(s => s.key === quest.financial_stage)

  return (
    <div className="fsc-section">
      <div className="fsc-header">
        <BoltIcon style={{ width: 18, height: 18, color: '#E9A23B' }} />
        <span className="fsc-header-title">Financial Security</span>
      </div>
      <div className="fsc-card">
        <div className="fsc-card-name">{quest.label}</div>

        {/* Stage progress dots */}
        <div className="fsc-stage">
          <span className="fsc-stage-label">
            {FINANCIAL_STAGES[currentStageIdx]?.label || 'Discovery'}
          </span>
          <div className="fsc-dots">
            {FINANCIAL_STAGES.map((stage, i) => (
              <div
                key={stage.key}
                className={`fsc-dot ${i <= currentStageIdx ? 'fsc-dot-filled' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Acquisition method picker */}
        {quest.financial_stage === 'acquisition' && (
          <div className="fsc-acquisition">
            <div className="fsc-acq-title">How do you want to find your first opportunity?</div>
            <div className="fsc-acq-options">
              <button className="fsc-acq-btn fsc-acq-recommended" onClick={() => handlePickMethod('employment')} disabled={methodSaving}>
                <span className="fsc-acq-badge">Recommended</span>
                Get hired (employment)
              </button>
              <button className="fsc-acq-btn" onClick={() => handlePickMethod('free_work')} disabled={methodSaving}>
                Do it 5 times for free
              </button>
              <button className="fsc-acq-btn" onClick={() => handlePickMethod('warm_outreach')} disabled={methodSaving}>
                Tell people you know
              </button>
              <button className="fsc-acq-btn" onClick={() => handlePickMethod('content')} disabled={methodSaving}>
                Show your work online
              </button>
              <button className="fsc-acq-btn" onClick={() => handlePickMethod('cold_outreach')} disabled={methodSaving}>
                Message people who need it
              </button>
            </div>
          </div>
        )}

        {/* Next challenge + CTA — only when NOT at acquisition stage */}
        {quest.financial_stage !== 'acquisition' && activeChallenge && (
          <div className="fsc-challenge">
            <div className="fsc-challenge-label">Next challenge:</div>
            <div className="fsc-challenge-text">{activeChallenge.title}</div>
          </div>
        )}

        {quest.financial_stage !== 'acquisition' && activeChallenge && (
          <button
            className="fsc-cta"
            onClick={() => {
              // Navigate to the paths tab — the QuestBoardCard will show this challenge
              navigate('/7-day-challenge?tab=weekly')
            }}
          >
            Start this challenge →
          </button>
        )}
      </div>
    </div>
  )
}
